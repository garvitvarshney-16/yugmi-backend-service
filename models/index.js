const sequelize = require('../config/database');
const User = require('./User');
const Organization = require('./Organization');
const Role = require('./Role');
const Project = require('./Project');
const Site = require('./Site');
const Capture = require('./Capture');
const Annotation = require('./Annotation');
const Report = require('./Report');
const UserSiteAccess = require('./UserSiteAccess');

// Define associations
User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

Role.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Organization.hasMany(Role, { foreignKey: 'organizationId', as: 'roles' });

Project.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Organization.hasMany(Project, { foreignKey: 'organizationId', as: 'projects' });

Site.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Site, { foreignKey: 'projectId', as: 'sites' });

Capture.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Site.hasMany(Capture, { foreignKey: 'siteId', as: 'captures' });

Capture.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Capture, { foreignKey: 'userId', as: 'captures' });

Annotation.belongsTo(Capture, { foreignKey: 'captureId', as: 'capture' });
Capture.hasMany(Annotation, { foreignKey: 'captureId', as: 'annotations' });

Report.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Site.hasMany(Report, { foreignKey: 'siteId', as: 'reports' });

Report.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Report, { foreignKey: 'createdBy', as: 'createdReports' });

// User Site Access (Many-to-Many)
User.belongsToMany(Site, { through: UserSiteAccess, foreignKey: 'userId', as: 'accessibleSites' });
Site.belongsToMany(User, { through: UserSiteAccess, foreignKey: 'siteId', as: 'authorizedUsers' });

module.exports = {
  sequelize,
  User,
  Organization,
  Role,
  Project,
  Site,
  Capture,
  Annotation,
  Report,
  UserSiteAccess
};