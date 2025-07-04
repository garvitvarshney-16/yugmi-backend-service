const { Capture, Site, User, Annotation } = require('../models');
const aiService = require('../services/aiService');
const storageService = require('../services/storageService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

class CaptureController {
  async createCapture(req, res) {
    try {
      const { siteId, mediaType, fileName, sensorData, wbsId, structurePart } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Media file is required',
        });
      }

      // Verify site access
      const site = await Site.findByPk(siteId);
      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site not found',
        });
      }

      // Parse sensorData
      let parsedSensorData;
      try {
        parsedSensorData = JSON.parse(sensorData);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sensorData JSON',
          error: error.message,
        });
      }

      // Upload file to S3
      const folderPath = storageService.generateFolderPath(req);
      const s3Url = await storageService.uploadFile(file, folderPath, fileName);

      // Create capture record
      const capture = await Capture.create({
        siteId,
        userId: req.user.UserId,
        mediaType,
        localFilePath: fileName, // Use fileName from request
        s3Url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        sensorData: parsedSensorData,
        wbsId,
        structurePart,
        processingStatus: 'pending',
      });

      // Generate thumbnail for images
      let thumbnailUrl = null;
      if (mediaType === 'image') {
        thumbnailUrl = await storageService.generateThumbnail(s3Url, capture.id);
        if (thumbnailUrl) {
          await capture.update({ thumbnailS3Url: thumbnailUrl });
        }
      }

      // Trigger AI analysis asynchronously
      // await this.processAIAnalysis(capture.CaptureId, s3Url, site.operationType, wbsId);

      res.status(201).json({
        success: true,
        message: 'Capture created successfully',
        data: { capture },
      });
    } catch (error) {
      logger.error('Capture creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create capture',
        error: error.message,
      });
    }
  }

  // async processAIAnalysis(captureId, mediaUrl, operationType, wbsId = null) {
  //   try {
  //     await Capture.update(
  //       { processingStatus: 'processing' },
  //       { where: { CaptureId: captureId } },
  //     );

  //     const aiAnalysis = await aiService.analyzeImage(mediaUrl, operationType, null, wbsId);

  //     await Capture.update(
  //       {
  //         aiAnalysis,
  //         processingStatus: 'completed',
  //       },
  //       { where: { CaptureId: captureId } },
  //     );

  //     logger.info(`AI analysis completed for capture ${captureId}`);
  //   } catch (error) {
  //     logger.error(`AI analysis failed for capture ${captureId}:`, error);
  //     await Capture.update(
  //       { processingStatus: 'failed' },
  //       { where: { CaptureId: captureId } },
  //     );
  //   }
  // }

  async processAIAnalysis(req, res) {
    const { captureId, mediaUrl, operationType, wbsId } = req.body
    try {
      await Capture.update(
        { processingStatus: 'processing' },
        { where: { CaptureId: captureId } },
      );

      const aiAnalysis = await aiService.analyzeImage(mediaUrl, operationType, null, wbsId);

      console.log(aiAnalysis)

      await Capture.update(
        {
          aiAnalysis,
          processingStatus: 'completed',
        },
        { where: { CaptureId: captureId } },
      );

      logger.info(`AI analysis completed for capture ${captureId}`);
      res.status(201).json({
        success: true,
        message: 'Analysis successfully',
        data: { aiAnalysis },
      });
    } catch (error) {
      await Capture.update(
        { processingStatus: 'failed' },
        { where: { CaptureId: captureId } },
      );
    }
  }

  async getCaptures(req, res) {
    try {
      const { page = 1, limit = 10, siteId, mediaType, processingStatus } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = { userId: req.user.id };

      if (siteId) {
        whereClause.siteId = siteId;
      }
      if (mediaType) {
        whereClause.mediaType = mediaType;
      }
      if (processingStatus) {
        whereClause.processingStatus = processingStatus;
      }

      const { count, rows: captures } = await Capture.findAndCountAll({
        where: whereClause,
        include: [
          { model: Site, as: 'site' },
          { model: User, as: 'user' },
          { model: Annotation, as: 'annotations' },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      // Generate signed URLs for media access
      const capturesWithSignedUrls = await Promise.all(
        captures.map(async (capture) => {
          const captureData = capture.toJSON();
          if (capture.s3Url) {
            const key = storageService.extractKeyFromUrl(capture.s3Url);
            captureData.signedUrl = await storageService.generateSignedUrl(key);
          }
          if (capture.thumbnailS3Url) {
            const thumbnailKey = storageService.extractKeyFromUrl(capture.thumbnailS3Url);
            captureData.thumbnailSignedUrl = await storageService.generateSignedUrl(thumbnailKey);
          }
          return captureData;
        }),
      );

      res.json({
        success: true,
        data: {
          captures: capturesWithSignedUrls,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      logger.error('Get captures failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get captures',
        error: error.message,
      });
    }
  }

  async getCaptureById(req, res) {
    try {
      const { id } = req.params;

      const capture = await Capture.findOne({
        where: { id, userId: req.user.id },
        include: [
          { model: Site, as: 'site' },
          { model: User, as: 'user' },
          { model: Annotation, as: 'annotations' },
        ],
      });

      if (!capture) {
        return res.status(404).json({
          success: false,
          message: 'Capture not found',
        });
      }

      // Generate signed URLs
      const captureData = capture.toJSON();
      if (capture.s3Url) {
        const key = storageService.extractKeyFromUrl(capture.s3Url);
        captureData.signedUrl = await storageService.generateSignedUrl(key);
      }
      if (capture.thumbnailS3Url) {
        const thumbnailKey = storageService.extractKeyFromUrl(capture.thumbnailS3Url);
        captureData.thumbnailSignedUrl = await storageService.generateSignedUrl(thumbnailKey);
      }

      res.json({
        success: true,
        data: { capture: captureData },
      });
    } catch (error) {
      logger.error('Get capture by ID failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get capture',
        error: error.message,
      });
    }
  }

  async redoAIAnalysis(req, res) {
    try {
      const { id } = req.params;
      const { customPrompt } = req.body;

      const capture = await Capture.findOne({
        where: { id, userId: req.user.id },
        include: [{ model: Site, as: 'site' }],
      });

      if (!capture) {
        return res.status(404).json({
          success: false,
          message: 'Capture not found',
        });
      }

      // Trigger AI analysis with custom prompt
      await Capture.update(
        { processingStatus: 'processing' },
        { where: { id } },
      );

      const aiAnalysis = await aiService.analyzeImage(
        capture.s3Url,
        capture.site.operationType,
        customPrompt,
        capture.wbsId,
      );

      await capture.update({
        aiAnalysis: {
          ...aiAnalysis,
          customPrompt,
        },
        processingStatus: 'completed',
      });

      res.json({
        success: true,
        message: 'AI analysis redone successfully',
        data: {
          aiAnalysis: capture.aiAnalysis,
        },
      });
    } catch (error) {
      logger.error('Redo AI analysis failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to redo AI analysis',
        error: error.message,
      });
    }
  }

  async shareCapture(req, res) {
    try {
      const { id } = req.params;
      const { method, recipient } = req.body; // method: 'email' or 'whatsapp'

      const capture = await Capture.findOne({
        where: { id, userId: req.user.id },
        include: [
          { model: Site, as: 'site' },
          { model: User, as: 'user' },
        ],
      });

      if (!capture) {
        return res.status(404).json({
          success: false,
          message: 'Capture not found',
        });
      }

      // Generate signed URL for sharing
      const key = storageService.extractKeyFromUrl(capture.s3Url);
      const signedUrl = await storageService.generateSignedUrl(key, 24 * 60 * 60); // 24 hours

      if (method === 'email') {
        await notificationService.shareCaptureViaEmail(
          recipient,
          capture,
          capture.aiAnalysis,
          signedUrl,
        );
      } else if (method === 'whatsapp') {
        await notificationService.shareCaptureViaWhatsApp(
          recipient,
          capture,
          capture.aiAnalysis,
          signedUrl,
        );
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid sharing method',
        });
      }

      // Update sharing status
      const updatedSharedVia = {
        ...capture.sharedVia,
        [method]: true,
      };

      await capture.update({
        isShared: true,
        sharedVia: updatedSharedVia,
      });

      res.json({
        success: true,
        message: `Capture shared via ${method} successfully`,
      });
    } catch (error) {
      logger.error('Share capture failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share capture',
        error: error.message,
      });
    }
  }

  async addAnnotation(req, res) {
    try {
      const { id } = req.params;
      const { type, coordinates, label, measurement, color, strokeWidth, notes } = req.body;

      const capture = await Capture.findOne({
        where: { id, userId: req.user.id },
      });

      if (!capture) {
        return res.status(404).json({
          success: false,
          message: 'Capture not found',
        });
      }

      const annotation = await Annotation.create({
        captureId: id,
        type,
        coordinates,
        label,
        measurement,
        color,
        strokeWidth,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Annotation added successfully',
        data: { annotation },
      });
    } catch (error) {
      logger.error('Add annotation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add annotation',
        error: error.message,
      });
    }
  }
}

module.exports = new CaptureController();