const { Project, Site, Organization, User } = require('../models');
const logger = require('../utils/logger');

class ProjectController {
  async createProject(req, res) {
    try {
      const { name, description, address, startDate, endDate, budget, wbsData } = req.body;

      const project = await Project.create({
        name,
        description,
        address,
        startDate,
        endDate,
        budget,
        wbsData,
        organizationId: req.user.organizationId
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project }
      });
    } catch (error) {
      logger.error('Project creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message
      });
    }
  }

  async getProjects(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;
      console.log(req.user.userType);

      const whereClause = {};
      if (req.user.userType === 'organization') {
        whereClause.organizationId = req.user.organizationId;
      }
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: projects } = await Project.findAndCountAll({
        where: whereClause,
        include: [
          { model: Organization, as: 'organization' },
          { model: Site, as: 'sites' }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      console.log(projects)



      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get projects failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get projects',
        error: error.message
      });
    }
  }

  // Route should be: GET /api/projects/:ProjectId
  async getProjectById(req, res) {
    try {
      const { ProjectId } = req.params;

      const project = await Project.findOne({
        where: {
          ProjectId,
          ...(req.user.userType === 'organization' && { organizationId: req.user.organizationId })
        },
        include: [
          { model: Organization, as: 'organization' },
          {
            model: Site,
            as: 'sites',
            include: [
              { model: User, as: 'authorizedUsers' }
            ]
          }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      res.json({
        success: true,
        data: { project }  // not "projects" as your response shows
      });
    } catch (error) {
      logger.error('Get project by ID failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get project',
        error: error.message
      });
    }
  }


  async updateProject(req, res) {
    try {
      const { ProjectId } = req.params;
      const updates = req.body;

      const project = await Project.findOne({
        where: {
          ProjectId,
          ...(req.user.userType === 'organization' && { organizationId: req.user.organizationId })
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      await project.update(updates);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: { project }
      });
    } catch (error) {
      logger.error('Project update failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error.message
      });
    }
  }

  async deleteProject(req, res) {
    try {
      const { ProjectId } = req.params;

      const project = await Project.findOne({
        where: {
          ProjectId,
          ...(req.user.userType === 'organization' && { organizationId: req.user.organizationId })
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if project has sites
      const sitesCount = await Site.count({ where: { projectId: ProjectId } });
      if (sitesCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete project with existing sites. Please delete all sites first.'
        });
      }

      await project.update({ isActive: false });

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      logger.error('Project deletion failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message
      });
    }
  }
}

module.exports = new ProjectController();