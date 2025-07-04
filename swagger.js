const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Construction Monitoring API',
      version: '1.0.0',
      description: 'A comprehensive API for construction monitoring, auditing, and inspection with AI-powered analysis',
      contact: {
        name: 'Construction Monitoring Team',
        email: 'support@constructionmonitoring.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.constructionmonitoring.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            userType: { type: 'string', enum: ['individual', 'organization'] },
            organizationId: { type: 'string', format: 'uuid' },
            roleId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            logoUrl: { type: 'string', format: 'uri' },
            subscriptionType: { type: 'string', enum: ['basic', 'premium', 'enterprise'] },
            maxUsers: { type: 'integer' },
            maxProjects: { type: 'integer' },
            isActive: { type: 'boolean' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            organizationId: { type: 'string', format: 'uuid' },
            permissions: {
              type: 'object',
              properties: {
                canCreateProject: { type: 'boolean' },
                canUpdateProject: { type: 'boolean' },
                canDeleteProject: { type: 'boolean' },
                canViewProject: { type: 'boolean' },
                canCreateSite: { type: 'boolean' },
                canUpdateSite: { type: 'boolean' },
                canDeleteSite: { type: 'boolean' },
                canViewSite: { type: 'boolean' },
                canCapture: { type: 'boolean' },
                canAnnotate: { type: 'boolean' },
                canViewCaptures: { type: 'boolean' },
                canCreateReport: { type: 'boolean' },
                canViewReport: { type: 'boolean' },
                canShareCaptures: { type: 'boolean' },
                canManageUsers: { type: 'boolean' }
              }
            },
            scope: {
              type: 'object',
              properties: {
                projectIds: { type: 'array', items: { type: 'string' } },
                siteIds: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            organizationId: { type: 'string', format: 'uuid' },
            address: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            budget: { type: 'number', format: 'decimal' },
            status: { type: 'string', enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'] },
            wbsData: { type: 'object' },
            isActive: { type: 'boolean' }
          }
        },
        Site: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            projectId: { type: 'string', format: 'uuid' },
            operationType: { type: 'string', enum: ['progress-monitoring', 'auditing', 'inspection'] },
            latitude: { type: 'number', format: 'double' },
            longitude: { type: 'number', format: 'double' },
            address: { type: 'string' },
            structureType: { type: 'string' },
            wbsMapping: { type: 'object' },
            isActive: { type: 'boolean' }
          }
        },
        Capture: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            siteId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            mediaType: { type: 'string', enum: ['image', 'video'] },
            fileName: { type: 'string' },
            fileSize: { type: 'integer' },
            mimeType: { type: 'string' },
            s3Url: { type: 'string', format: 'uri' },
            thumbnailS3Url: { type: 'string', format: 'uri' },
            sensorData: { type: 'object' },
            aiAnalysis: { type: 'object' },
            wbsId: { type: 'string' },
            structurePart: { type: 'string' },
            processingStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            isShared: { type: 'boolean' },
            sharedVia: { type: 'object' }
          }
        },
        Annotation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            captureId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['drawing', 'measurement', 'tag', 'defect-marker'] },
            coordinates: { type: 'array', items: { type: 'object' } },
            label: { type: 'string' },
            measurement: { type: 'object' },
            color: { type: 'string' },
            strokeWidth: { type: 'integer' },
            notes: { type: 'string' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer' },
            totalPages: { type: 'integer' },
            totalItems: { type: 'integer' },
            itemsPerPage: { type: 'integer' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'userType'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            userType: { type: 'string', enum: ['individual', 'organization'] },
            organizationData: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                address: { type: 'string' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Construction Monitoring API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  })
};