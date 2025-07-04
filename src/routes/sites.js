const express = require('express');
const siteController = require('../controllers/siteController');
const { authenticateToken, requirePermission, requireOrgAdmin } = require('../middleware/auth');
const { validateSite, validateUUIDParam } = require('../middleware/validation');

const router = express.Router();


/**
 * @swagger
 * /api/sites:
 *   post:
 *     summary: Create a new site
 *     tags: [Site Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectId, operationType]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               operationType:
 *                 type: string
 *                 enum: [progress-monitoring, auditing, inspection]
 *               latitude:
 *                 type: number
 *                 format: double
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 format: double
 *                 minimum: -180
 *                 maximum: 180
 *               address:
 *                 type: string
 *               structureType:
 *                 type: string
 *               wbsMapping:
 *                 type: object
 *           example:
 *             name: "Foundation Site A"
 *             description: "Foundation work for Tower A"
 *             projectId: "project-uuid-here"
 *             operationType: "progress-monitoring"
 *             latitude: 40.7128
 *             longitude: -74.0060
 *             address: "456 Downtown Ave, Foundation Area"
 *             structureType: "Building"
 *             wbsMapping:
 *               "1.1": "Excavation"
 *               "1.2": "Concrete Pour"
 *               "1.3": "Reinforcement"
 *     responses:
 *       201:
 *         description: Site created successfully
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
 *                         site:
 *                           $ref: '#/components/schemas/Site'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.post('/', 
  authenticateToken, 
  requirePermission('canCreateSite'), 
  validateSite, 
  siteController.createSite
);

/**
 * @swagger
 * /api/sites:
 *   get:
 *     summary: Get all sites
 *     tags: [Site Management]
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
 *         name: operationType
 *         schema:
 *           type: string
 *           enum: [progress-monitoring, auditing, inspection]
 *         description: Filter by operation type
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: Sites retrieved successfully
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
 *                         sites:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Site'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationResponse'
 */
router.get('/', 
  authenticateToken, 
  requirePermission('canViewSite'), 
  siteController.getSites
);


/**
 * @swagger
 * /api/sites/{id}:
 *   get:
 *     summary: Get site by ID
 *     tags: [Site Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site retrieved successfully
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
 *                         site:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Site'
 *                             - type: object
 *                               properties:
 *                                 project:
 *                                   $ref: '#/components/schemas/Project'
 *                                 authorizedUsers:
 *                                   type: array
 *                                   items:
 *                                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied to this site
 *       404:
 *         description: Site not found
 */
router.get('/:id', 
  authenticateToken, 
  requirePermission('canViewSite'), 
  validateUUIDParam('id'), 
  siteController.getSiteById
);


/**
 * @swagger
 * /api/sites/{id}:
 *   put:
 *     summary: Update site
 *     tags: [Site Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
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
 *               operationType:
 *                 type: string
 *                 enum: [progress-monitoring, auditing, inspection]
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               structureType:
 *                 type: string
 *               wbsMapping:
 *                 type: object
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       404:
 *         description: Site not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', 
  authenticateToken, 
  requirePermission('canUpdateSite'), 
  validateUUIDParam('id'), 
  siteController.updateSite
);

/**
 * @swagger
 * /api/sites/{id}:
 *   delete:
 *     summary: Delete site
 *     tags: [Site Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *       400:
 *         description: Cannot delete site with existing captures
 *       404:
 *         description: Site not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id', 
  authenticateToken, 
  requirePermission('canDeleteSite'), 
  validateUUIDParam('id'), 
  siteController.deleteSite
);


/**
 * @swagger
 * /api/sites/assign-user:
 *   post:
 *     summary: Assign user to site (Admin only)
 *     tags: [Site Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [siteId, userId]
 *             properties:
 *               siteId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               accessLevel:
 *                 type: string
 *                 enum: [view, capture, full]
 *                 default: capture
 *           example:
 *             siteId: "site-uuid-here"
 *             userId: "user-uuid-here"
 *             accessLevel: "capture"
 *     responses:
 *       200:
 *         description: User assigned to site successfully
 *       404:
 *         description: User or site not found
 *       403:
 *         description: Insufficient permissions
 */
router.post('/assign-user', 
  authenticateToken, 
  requireOrgAdmin, 
  siteController.assignUserToSite
);

module.exports = router;