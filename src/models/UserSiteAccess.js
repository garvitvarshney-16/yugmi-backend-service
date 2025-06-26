const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSiteAccess = sequelize.define('UserSiteAccess', {
  UserSiteAccessId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserId'
    }
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Sites',
      key: 'SiteId'
    }
  },
  accessLevel: {
    type: DataTypes.ENUM('view', 'capture', 'full'),
    defaultValue: 'capture'
  },
  grantedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'UserId'
    }
  }
}, {
  tableName: 'UserSiteAccess',
  timestamps: true
});

module.exports = UserSiteAccess;