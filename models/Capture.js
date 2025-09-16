const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Capture = sequelize.define('Capture', {
  CaptureId: {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserId'
    }
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false
  },
  localFilePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  s3Url: {
    type: DataTypes.STRING
  },
  thumbnailS3Url: {
    type: DataTypes.STRING
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.BIGINT
  },
  mimeType: {
    type: DataTypes.STRING
  },
  duration: {
    type: DataTypes.INTEGER // For videos in seconds
  },
  sensorData: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      latitude: null,
      longitude: null,
      altitude: null,
      timestamp: null,
      cameraParams: {
        focus: null,
        exposure: null,
        iso: null,
        shutterSpeed: null,
        aperture: null
      },
      accelerometer: {
        x: null,
        y: null,
        z: null
      },
      gyroscope: {
        x: null,
        y: null,
        z: null
      },
      compass: null,
      deviceInfo: {
        model: null,
        os: null,
        appVersion: null
      }
    }
  },
  aiAnalysis: {
    type: DataTypes.JSONB,
    defaultValue: {
      summary: null,
      defects: [],
      progressStatus: null,
      confidence: null,
      processingTime: null,
      apiProvider: null, // 'openai' or 'gemini'
      customPrompt: null
    }
  },
  wbsId: {
    type: DataTypes.STRING
  },
  structurePart: {
    type: DataTypes.STRING
  },
  depthMapUrl: {
    type: DataTypes.STRING
  },
  processingStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  isShared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sharedVia: {
    type: DataTypes.JSONB,
    defaultValue: {
      whatsapp: false,
      email: false,
      report: false
    }
  }
}, {
  tableName: 'Captures',
  timestamps: true
});

module.exports = Capture;