const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  ProjectId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 255]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'OrganizationId'
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2)
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  wbsData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Projects',
  timestamps: true
});

module.exports = Project;