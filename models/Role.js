const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  RoleId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'OrganizationId'
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      canCreateProject: false,
      canUpdateProject: false,
      canDeleteProject: false,
      canViewProject: true,
      canCreateSite: false,
      canUpdateSite: false,
      canDeleteSite: false,
      canViewSite: true,
      canCapture: true,
      canAnnotate: true,
      canViewCaptures: true,
      canCreateReport: false,
      canViewReport: true,
      canShareCaptures: true,
      canManageUsers: false
    }
  },
  scope: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      projectIds: [], // Empty array means no access, ['*'] means all projects
      siteIds: [] // Empty array means no access, ['*'] means all sites
    }
  }
}, {
  tableName: 'Roles',
  timestamps: true
});

module.exports = Role;