const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateProject, validateUUIDParam } = require('../middleware/validation');

const router = express.Router();

router.post('/', 
  authenticateToken, 
  requirePermission('canCreateProject'), 
  validateProject, 
  projectController.createProject
);

router.get('/', 
  authenticateToken, 
  requirePermission('canViewProject'), 
  projectController.getProjects
);

router.get('/:id', 
  authenticateToken, 
  requirePermission('canViewProject'), 
  validateUUIDParam('id'), 
  projectController.getProjectById
);

router.put('/:id', 
  authenticateToken, 
  requirePermission('canUpdateProject'), 
  validateUUIDParam('id'), 
  projectController.updateProject
);

router.delete('/:id', 
  authenticateToken, 
  requirePermission('canDeleteProject'), 
  validateUUIDParam('id'), 
  projectController.deleteProject
);

module.exports = router;