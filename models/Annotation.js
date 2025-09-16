const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Annotation = sequelize.define('Annotation', {
  AnnotationId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  captureId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Captures',
      key: 'CaptureId'
    }
  },
  type: {
    type: DataTypes.ENUM('drawing', 'measurement', 'tag', 'defect-marker'),
    allowNull: false
  },
  coordinates: {
    type: DataTypes.JSONB,
    allowNull: false // Array of points [{x, y}, {x, y}] for lines/polygons
  },
  label: {
    type: DataTypes.STRING
  },
  measurement: {
    type: DataTypes.JSONB,
    defaultValue: {
      value: null,
      unit: 'meters',
      description: null
    }
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#FF0000'
  },
  strokeWidth: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'Annotations',
  timestamps: true
});

module.exports = Annotation;