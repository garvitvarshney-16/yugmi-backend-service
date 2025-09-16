const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  ReportId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Sites',
      key: 'SiteId'
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserId'
    }
  },
  reportType: {
    type: DataTypes.ENUM('progress', 'audit', 'inspection'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT
  },
  captureIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  reportData: {
    type: DataTypes.JSONB,
    defaultValue: {
      totalCaptures: 0,
      defectsFound: 0,
      progressPercentage: null,
      recommendations: [],
      wbsProgress: {}
    }
  },
  pdfUrl: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'shared'),
    defaultValue: 'draft'
  }
}, {
  tableName: 'Reports',
  timestamps: true
});

module.exports = Report;