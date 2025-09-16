const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Site = sequelize.define('Site', {
  SiteId: {
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
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'ProjectId'
    }
  },
  operationType: {
    type: DataTypes.ENUM('progress-monitoring', 'auditing', 'inspection'),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DOUBLE,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DOUBLE,
    validate: {
      min: -180,
      max: 180
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  structureType: {
    type: DataTypes.STRING // Building, Bridge, Road, etc.
  },
  wbsMapping: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Sites',
  timestamps: true
});

module.exports = Site;