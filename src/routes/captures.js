const express = require('express');
const captureController = require('../controllers/captureController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateCapture, validateUUIDParam } = require('../middleware/validation');
const storageService = require('../services/storageService');

const router = express.Router();

const upload = storageService.getUploadMiddleware();


/**
 * @swagger
 * /api/captures:
 *   post:
 *     summary: Upload a new capture (image/video)
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [mediaFile, siteId, mediaType, sensorData]
 *             properties:
 *               mediaFile:
 *                 type: string
 *                 format: binary
 *                 description: Image or video file (max 50MB)
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 description: Site ID where capture was taken
 *               mediaType:
 *                 type: string
 *                 enum: [image, video]
 *               fileName:
 *                 type: string
 *                 description: Custom filename (optional)
 *               wbsId:
 *                 type: string
 *                 description: Work Breakdown Structure ID
 *               structurePart:
 *                 type: string
 *                 description: Specific structure part being captured
 *               sensorData:
 *                 type: string
 *                 description: JSON string containing sensor data
 *                 example: '{"latitude":40.7128,"longitude":-74.0060,"altitude":10.5,"timestamp":"2024-01-01T12:00:00.000Z","cameraParams":{"focus":2.8,"exposure":"1/125","iso":200},"accelerometer":{"x":0.1,"y":0.2,"z":9.8},"gyroscope":{"x":0.01,"y":0.02,"z":0.01},"compass":45.5,"deviceInfo":{"model":"iPhone 14 Pro","os":"iOS 17.0","appVersion":"1.0.0"}}'
 *     responses:
 *       201:
 *         description: Capture created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         capture:
 *                           $ref: '#/components/schemas/Capture'
 *       400:
 *         description: Media file is required or validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Site not found
 */
router.post('/',
  authenticateToken,
  // requirePermission('canCapture'),
  // upload.single('mediaFile'),
  storageService.getUploadMiddleware(),
  validateCapture,
  captureController.createCapture
);


/**
 * @swagger
 * /api/captures:
 *   get:
 *     summary: Get all captures
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by site ID
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [image, video]
 *         description: Filter by media type
 *       - in: query
 *         name: processingStatus
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         description: Filter by AI processing status
 *     responses:
 *       200:
 *         description: Captures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         captures:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Capture'
 *                               - type: object
 *                                 properties:
 *                                   signedUrl:
 *                                     type: string
 *                                     description: Temporary signed URL for media access
 *                                   thumbnailSignedUrl:
 *                                     type: string
 *                                     description: Temporary signed URL for thumbnail
 *                                   site:
 *                                     $ref: '#/components/schemas/Site'
 *                                   annotations:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/Annotation'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationResponse'
 */
router.get('/',
  authenticateToken,
  requirePermission('canViewCaptures'),
  captureController.getCaptures
);


/**
 * @swagger
 * /api/captures/by-project-or-site:
 *   get:
 *     summary: Get all captures by projectId or siteId
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID to fetch all captures for all sites under this project
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID to fetch all captures for this site
 *     responses:
 *       200:
 *         description: Captures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         captures:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Capture'
 *                               - type: object
 *                                 properties:
 *                                   signedUrl:
 *                                     type: string
 *                                   thumbnailSignedUrl:
 *                                     type: string
 *                                   site:
 *                                     $ref: '#/components/schemas/Site'
 *                                   annotations:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/Annotation'
 *       400:
 *         description: Either projectId or siteId must be provided
 *       404:
 *         description: No sites found for this project
 */
router.get('/by-project-or-site', authenticateToken, captureController.getCapturesByProjectOrSite);


/**
 * @swagger
 * /api/captures/{id}:
 *   get:
 *     summary: Get capture by ID
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Capture ID
 *     responses:
 *       200:
 *         description: Capture retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         capture:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Capture'
 *                             - type: object
 *                               properties:
 *                                 signedUrl:
 *                                   type: string
 *                                 thumbnailSignedUrl:
 *                                   type: string
 *                                 site:
 *                                   $ref: '#/components/schemas/Site'
 *                                 annotations:
 *                                   type: array
 *                                   items:
 *                                     $ref: '#/components/schemas/Annotation'
 *       404:
 *         description: Capture not found
 */
router.get('/:id',
  authenticateToken,
  requirePermission('canViewCaptures'),
  validateUUIDParam('id'),
  captureController.getCaptureById
);


/**
 * @swagger
 * /api/captures/analysis:
 *   post:
 *     summary: Process AI analysis for a capture
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [captureId, mediaUrl, operationType]
 *             properties:
 *               captureId:
 *                 type: string
 *                 format: uuid
 *                 description: Capture ID to process AI analysis for
 *               mediaUrl:
 *                 type: string
 *                 description: URL of the media to analyze
 *               operationType:
 *                 type: string
 *                 description: Type of operation (e.g., progress-monitoring, auditing, inspection)
 *               wbsId:
 *                 type: string
 *                 description: Work Breakdown Structure ID (optional)
 *     responses:
 *       200:
 *         description: AI analysis processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Capture not found
 */
router.post('/analysis', authenticateToken, captureController.processAIAnalysis);



/**
 * @swagger
 * /api/captures/{id}/ai-analysis/redo:
 *   post:
 *     summary: Redo AI analysis with optional custom prompt
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Capture ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customPrompt:
 *                 type: string
 *                 description: Custom prompt for AI analysis
 *           example:
 *             customPrompt: "Focus specifically on concrete quality and any visible defects in the foundation walls. Provide detailed assessment of surface finish quality."
 *     responses:
 *       200:
 *         description: AI analysis redone successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         aiAnalysis:
 *                           type: object
 *                           properties:
 *                             summary:
 *                               type: string
 *                             defects:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             confidence:
 *                               type: number
 *                             customPrompt:
 *                               type: string
 *       404:
 *         description: Capture not found
 */
router.post('/:id/ai-analysis/redo',
  authenticateToken,
  requirePermission('canCapture'),
  validateUUIDParam('id'),
  captureController.redoAIAnalysis
);


/**
 * @swagger
 * /api/captures/{id}/share:
 *   post:
 *     summary: Share capture via email or WhatsApp
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Capture ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method, recipient]
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [email, whatsapp]
 *                 description: Sharing method
 *               recipient:
 *                 type: string
 *                 description: Email address or phone number
 *           examples:
 *             email:
 *               summary: Share via email
 *               value:
 *                 method: "email"
 *                 recipient: "supervisor@constructionco.com"
 *             whatsapp:
 *               summary: Share via WhatsApp
 *               value:
 *                 method: "whatsapp"
 *                 recipient: "+1234567890"
 *     responses:
 *       200:
 *         description: Capture shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid sharing method
 *       404:
 *         description: Capture not found
 */
router.post('/:id/share',
  authenticateToken,
  requirePermission('canShareCaptures'),
  validateUUIDParam('id'),
  captureController.shareCapture
);


/**
 * @swagger
 * /api/captures/{id}/annotations:
 *   post:
 *     summary: Add annotation to capture
 *     tags: [Capture Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Capture ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, coordinates]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [drawing, measurement, tag, defect-marker]
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     x:
 *                       type: number
 *                     y:
 *                       type: number
 *               label:
 *                 type: string
 *               measurement:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   description:
 *                     type: string
 *               color:
 *                 type: string
 *                 default: "#FF0000"
 *               strokeWidth:
 *                 type: integer
 *                 default: 3
 *               notes:
 *                 type: string
 *           example:
 *             type: "measurement"
 *             coordinates:
 *               - x: 100
 *                 y: 150
 *               - x: 300
 *                 y: 150
 *             label: "Wall Height"
 *             measurement:
 *               value: 3.2
 *               unit: "meters"
 *               description: "Foundation wall height measurement"
 *             color: "#FF0000"
 *             strokeWidth: 3
 *             notes: "Measured using depth map data"
 *     responses:
 *       201:
 *         description: Annotation added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         annotation:
 *                           $ref: '#/components/schemas/Annotation'
 *       404:
 *         description: Capture not found
 */
router.post('/:id/annotations',
  authenticateToken,
  requirePermission('canAnnotate'),
  validateUUIDParam('id'),
  captureController.addAnnotation
);

module.exports = router;