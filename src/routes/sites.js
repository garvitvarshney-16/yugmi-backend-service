const express = require('express');
const siteController = require('../controllers/siteController');
const { authenticateToken, requirePermission, requireOrgAdmin } = require('../middleware/auth');
const { validateSite, validateUUIDParam } = require('../middleware/validation');

const router = express.Router();

router.post('/', 
  authenticateToken, 
  requirePermission('canCreateSite'), 
  validateSite, 
  siteController.createSite
);

router.get('/', 
  authenticateToken, 
  requirePermission('canViewSite'), 
  siteController.getSites
);

router.get('/:id', 
  authenticateToken, 
  requirePermission('canViewSite'), 
  validateUUIDParam('id'), 
  siteController.getSiteById
);

router.put('/:id', 
  authenticateToken, 
  requirePermission('canUpdateSite'), 
  validateUUIDParam('id'), 
  siteController.updateSite
);

router.delete('/:id', 
  authenticateToken, 
  requirePermission('canDeleteSite'), 
  validateUUIDParam('id'), 
  siteController.deleteSite
);

router.post('/assign-user', 
  authenticateToken, 
  requireOrgAdmin, 
  siteController.assignUserToSite
);

module.exports = router;