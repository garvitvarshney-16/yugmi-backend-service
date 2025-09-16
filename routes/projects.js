const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateProject, validateUUIDParam } = require('../middleware/validation');

const router = express.Router();


/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               budget:
 *                 type: number
 *                 format: decimal
 *               wbsData:
 *                 type: object
 *           example:
 *             name: "Downtown Office Complex"
 *             description: "50-story office building construction project"
 *             address: "456 Downtown Ave, Metro City"
 *             startDate: "2024-01-15"
 *             endDate: "2025-12-31"
 *             budget: 50000000.00
 *             wbsData:
 *               "1.0": "Foundation"
 *               "2.0": "Structure"
 *               "3.0": "MEP Systems"
 *               "4.0": "Finishing"
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                         project:
 *                           $ref: '#/components/schemas/Project'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', 
  authenticateToken, 
  requirePermission('canCreateProject'), 
  validateProject, 
  projectController.createProject
);


/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Project Management]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on-hold, completed, cancelled]
 *         description: Filter by project status
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
 *                         projects:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Project'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationResponse'
 */
router.get('/', 
  authenticateToken, 
  requirePermission('canViewProject'), 
  projectController.getProjects
);


/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
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
 *                         project:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Project'
 *                             - type: object
 *                               properties:
 *                                 organization:
 *                                   $ref: '#/components/schemas/Organization'
 *                                 sites:
 *                                   type: array
 *                                   items:
 *                                     $ref: '#/components/schemas/Site'
 *       404:
 *         description: Project not found
 */
router.get('/:ProjectId', 
  authenticateToken, 
  requirePermission('canViewProject'), 
  // validateUUIDParam('id'), 
  projectController.getProjectById
);


/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planning, active, on-hold, completed, cancelled]
 *               budget:
 *                 type: number
 *               endDate:
 *                 type: string
 *                 format: date
 *           example:
 *             status: "active"
 *             budget: 55000000.00
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:ProjectId', 
  authenticateToken, 
  requirePermission('canUpdateProject'), 
  // validateUUIDParam('id'), 
  projectController.updateProject
);


/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       400:
 *         description: Cannot delete project with existing sites
 *       404:
 *         description: Project not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:ProjectId', 
  authenticateToken, 
  requirePermission('canDeleteProject'), 
  // validateUUIDParam('id'), 
  projectController.deleteProject
);

module.exports = router;