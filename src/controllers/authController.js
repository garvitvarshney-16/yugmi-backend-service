const jwt = require('jsonwebtoken');
const { User, Organization, Role } = require('../models');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
  try {
    const { email, password, firstName, lastName, userType, organizationData } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    let user;
    let organization = null;

    if (userType === 'organization') {
      organization = await Organization.create({
        name: organizationData.name,
        email: organizationData.email,
        phone: organizationData.phone,
        address: organizationData.address
      });

      const adminRole = await Role.create({
        name: 'Organization Admin',
        organizationId: organization.OrganizationId, // ✅ Correct field
        permissions: {
          canCreateProject: true,
          canUpdateProject: true,
          canDeleteProject: true,
          canViewProject: true,
          canCreateSite: true,
          canUpdateSite: true,
          canDeleteSite: true,
          canViewSite: true,
          canCapture: true,
          canAnnotate: true,
          canViewCaptures: true,
          canCreateReport: true,
          canViewReport: true,
          canShareCaptures: true,
          canManageUsers: true
        },
        scope: {
          projectIds: ['*'],
          siteIds: ['*']
        }
      });

      user = await User.create({
        email,
        password,
        firstName,
        lastName,
        userType,
        organizationId: organization.OrganizationId, // ✅ Correct field
        roleId: adminRole.RoleId // ✅ Make sure you're using the primary key
      });
    } else {
      user = await User.create({
        email,
        password,
        firstName,
        lastName,
        userType
      });
    }

    const tokens = AuthController.generateTokens(user.UserId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        organization,
        ...tokens
      }
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
}


  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
        include: [
          { model: Organization, as: 'organization' },
          { model: Role, as: 'role' }
        ]
      });

      if (!user || !(await user.validatePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      await user.update({ lastLoginAt: new Date() });

      const tokens = AuthController.generateTokens(user.UserId);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          ...tokens
        }
      });
    } catch (error) {
      logger.error('Login failed:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [
          { model: Organization, as: 'organization' },
          { model: Role, as: 'role' }
        ]
      });

      res.json({
        success: true,
        data: { user: user.toJSON() }
      });
    } catch (error) {
      logger.error('Get profile failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  static generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
  }
}

module.exports = new AuthController();
