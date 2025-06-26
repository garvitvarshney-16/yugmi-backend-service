const express = require('express');
const captureController = require('../controllers/captureController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateCapture, validateUUIDParam } = require('../middleware/validation');
const storageService = require('../services/storageService');

const router = express.Router();

const upload = storageService.getUploadMiddleware();

router.post('/', 
  authenticateToken,
  // requirePermission('canCapture'), 
  // upload.single('mediaFile'),
  storageService.getUploadMiddleware(),
  validateCapture, 
  captureController.createCapture
);

router.get('/', 
  authenticateToken, 
  requirePermission('canViewCaptures'), 
  captureController.getCaptures
);



router.get('/:id', 
  authenticateToken, 
  requirePermission('canViewCaptures'), 
  validateUUIDParam('id'), 
  captureController.getCaptureById
);


router.post('/analysis', captureController.processAIAnalysis);

router.post('/:id/ai-analysis/redo', 
  authenticateToken, 
  requirePermission('canCapture'), 
  validateUUIDParam('id'), 
  captureController.redoAIAnalysis
);

router.post('/:id/share', 
  authenticateToken, 
  requirePermission('canShareCaptures'), 
  validateUUIDParam('id'), 
  captureController.shareCapture
);

router.post('/:id/annotations', 
  authenticateToken, 
  requirePermission('canAnnotate'), 
  validateUUIDParam('id'), 
  captureController.addAnnotation
);

module.exports = router;