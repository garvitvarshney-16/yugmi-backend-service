const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const logger = require('../utils/logger');

// Configure S3Client for AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

class StorageService {
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET;
    // Configure multer for in-memory storage
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image and video files are allowed'));
        }
      },
    });
  }

  // Multer middleware for file uploads
  getUploadMiddleware() {
    if (!this.bucketName) {
      logger.warn('AWS_S3_BUCKET is not set. Upload middleware is disabled.');
      return (req, res, next) => {
        next(new Error('S3 bucket is not configured. File upload is currently disabled.'));
      };
    }
    return this.upload.single('mediaFile');
  }

  // Generate folder path for S3 key
  generateFolderPath(req) {
    const { organizationId, projectId, siteId } = req.body;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    if (organizationId && projectId && siteId) {
      return `organizations/${organizationId}/projects/${projectId}/sites/${siteId}/${year}/${month}`;
    } else {
      return `individuals/${req.user.id}/${year}/${month}`;
    }
  }

  // Upload file to S3 using @aws-sdk/lib-storage
  async uploadFile(file, folderPath, fileName) {
    try {
      const ext = path.extname(file.originalname);
      const s3Key = `yugmi-sense/${folderPath}/${fileName || `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`}`;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'private',
        },
      });

      const result = await upload.done();
      return result.Location;
    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw error;
    }
  }

  // Generate thumbnail for images
  async generateThumbnail(imageUrl, captureId) {
    try {
      const imageKey = this.extractKeyFromUrl(imageUrl);
      const getParams = {
        Bucket: this.bucketName,
        Key: imageKey,
      };

      const command = new GetObjectCommand(getParams);
      const imageData = await s3Client.send(command);

      // Convert ReadableStream to Buffer for Sharp
      const chunks = [];
      for await (const chunk of imageData.Body) {
        chunks.push(chunk);
      }
      const imageBuffer = Buffer.concat(chunks);

      // Generate thumbnail using Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail to S3
      const thumbnailKey = imageKey.replace(/\.[^/.]+$/, '_thumb.jpg');
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.bucketName,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          ACL: 'private',
        },
      });

      const result = await upload.done();
      return result.Location;
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  // Generate signed URL for accessing S3 objects
  async generateSignedUrl(key, expiration = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiration });
      return signedUrl;
    } catch (error) {
      logger.error('Signed URL generation failed:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      logger.error('File deletion failed:', error);
      return false;
    }
  }

  // Extract S3 key from URL
  extractKeyFromUrl(url) {
    const urlParts = url.split('.amazonaws.com/');
    return urlParts[1];
  }

  // Sync local file to S3 (optional, used for local-to-S3 sync)
  async syncLocalToS3(localPath, s3Key) {
    try {
      const fs = require('fs');
      const fileContent = fs.readFileSync(localPath);

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: fileContent,
          ACL: 'private',
        },
      });

      const result = await upload.done();
      return result.Location;
    } catch (error) {
      logger.error('Local to S3 sync failed:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();