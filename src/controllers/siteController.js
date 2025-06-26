const { Site, Project, User, UserSiteAccess, Capture } = require('../models');
const logger = require('../utils/logger');

class SiteController {
  async createSite(req, res) {
    try {
      const { 
        name,
        description, 
        projectId,
        operationType, 
        latitude, 
        longitude, 
        address, 
        structureType, 
        wbsMapping 
      } = req.body;

      // Verify project exists and belongs to user's organization
      const project = await Project.findOne({
        where: { 
          ProjectId: projectId,
          ...(req.user.userType === 'organization' && { organizationId: req.user.organizationId })
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const site = await Site.create({
        name,
        description,
        projectId,
        operationType,
        latitude,
        longitude,
        address,
        structureType,
        wbsMapping
      });

      res.status(201).json({
        success: true,
        message: 'Site created successfully',
        data: { site }
      });
    } catch (error) {
      logger.error('Site creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create site',
        error: error.message
      });
    }
  }

  async getSites(req, res) {
    try {
      const { page = 1, limit = 10, operationType, projectId } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      let include = [
        { 
          model: Project, 
          as: 'project',
          ...(req.user.userType === 'organization' && {
            where: { organizationId: req.user.organizationId }
          })
        }
      ];

      // Filter by operation type
      if (operationType) {
        whereClause.operationType = operationType;
      }

      // Filter by project
      if (projectId) {
        whereClause.projectId = projectId;
      }

      // For organization users, filter by accessible sites
      if (req.user.userType === 'organization' && req.user.role && 
          req.user.role.scope.siteIds[0] !== '*') {
        whereClause.id = req.user.role.scope.siteIds;
      }

      const { count, rows: sites } = await Site.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          sites,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get sites failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sites',
        error: error.message
      });
    }
  }

  async getSiteById(req, res) {
    try {
      const { id } = req.params;

      let whereClause = { id };
      let include = [
        { 
          model: Project, 
          as: 'project',
          ...(req.user.userType === 'organization' && {
            where: { organizationId: req.user.organizationId }
          })
        },
        { model: User, as: 'authorizedUsers' }
      ];

      const site = await Site.findOne({
        where: whereClause,
        include
      });

      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site not found'
        });
      }

      // Check if user has access to this site
      if (req.user.userType === 'organization' && req.user.role && 
          req.user.role.scope.siteIds[0] !== '*' &&
          !req.user.role.scope.siteIds.includes(id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this site'
        });
      }

      res.json({
        success: true,
        data: { site }
      });
    } catch (error) {
      logger.error('Get site by ID failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get site',
        error: error.message
      });
    }
  }

  async updateSite(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const site = await Site.findOne({
        where: { id },
        include: [
          { 
            model: Project, 
            as: 'project',
            ...(req.user.userType === 'organization' && {
              where: { organizationId: req.user.organizationId }
            })
          }
        ]
      });

      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site not found'
        });
      }

      await site.update(updates);

      res.json({
        success: true,
        message: 'Site updated successfully',
        data: { site }
      });
    } catch (error) {
      logger.error('Site update failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update site',
        error: error.message
      });
    }
  }

  async deleteSite(req, res) {
    try {
      const { id } = req.params;

      const site = await Site.findOne({
        where: { id },
        include: [
          { 
            model: Project, 
            as: 'project',
            ...(req.user.userType === 'organization' && {
              where: { organizationId: req.user.organizationId }
            })
          }
        ]
      });

      if (!site) {
        return res.status(404).json({
          success: false,
          message: 'Site not found'
        });
      }

      // Check if site has captures
      const capturesCount = await Capture.count({ where: { siteId: id } });
      if (capturesCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete site with existing captures. Please delete all captures first.'
        });
      }

      await site.update({ isActive: false });

      res.json({
        success: true,
        message: 'Site deleted successfully'
      });
    } catch (error) {
      logger.error('Site deletion failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete site',
        error: error.message
      });
    }
  }

  async assignUserToSite(req, res) {
    try {
      const { siteId, userId, accessLevel = 'capture' } = req.body;

      // Verify the user and site belong to the same organization
      const user = await User.findOne({
        where: { 
          id: userId,
          organizationId: req.user.organizationId
        }
      });

      const site = await Site.findOne({
        where: { id: siteId },
        include: [
          { 
            model: Project, 
            as: 'project',
            where: { organizationId: req.user.organizationId }
          }
        ]
      });

      if (!user || !site) {
        return res.status(404).json({
          success: false,
          message: 'User or site not found'
        });
      }

      // Check if assignment already exists
      const existingAccess = await UserSiteAccess.findOne({
        where: { userId, siteId }
      });

      if (existingAccess) {
        await existingAccess.update({ accessLevel, grantedBy: req.user.id });
      } else {
        await UserSiteAccess.create({
          userId,
          siteId,
          accessLevel,
          grantedBy: req.user.id
        });
      }

      res.json({
        success: true,
        message: 'User assigned to site successfully'
      });
    } catch (error) {
      logger.error('Site assignment failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign user to site',
        error: error.message
      });
    }
  }
}

module.exports = new SiteController();