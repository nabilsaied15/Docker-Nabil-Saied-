const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BasicFit2 API',
      version: '1.0.0',
      description: 'API pour application de suivi sportif BasicFit2'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Activity: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            type: {
              type: 'string',
              enum: ['running', 'cycling', 'swimming', 'walking', 'gym', 'yoga', 'hiking', 'tennis', 'basketball', 'football'],
              example: 'running'
            },
            duration: {
              type: 'integer',
              example: 30
            },
            calories: {
              type: 'integer',
              example: 250
            },
            distance: {
              type: 'number',
              example: 5.5
            },
            notes: {
              type: 'string',
              example: 'Belle course ce matin'
            },
            date: {
              type: 'string',
              format: 'date-time'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Goal: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'Courir 100 km ce mois'
            },
            description: {
              type: 'string',
              example: 'Objectif de course à pied pour le mois'
            },
            type: {
              type: 'string',
              enum: ['duration', 'distance', 'calories', 'activities_count'],
              example: 'distance'
            },
            target_value: {
              type: 'number',
              example: 100
            },
            current_value: {
              type: 'number',
              example: 45.5
            },
            start_date: {
              type: 'string',
              format: 'date',
              example: '2025-11-01'
            },
            end_date: {
              type: 'string',
              format: 'date',
              example: '2025-11-30'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled'],
              example: 'active'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', example: 'user@example.com' },
                role: { type: 'string', example: 'user' }
              }
            }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              example: 'month'
            },
            totalActivities: {
              type: 'integer',
              example: 15
            },
            totalDuration: {
              type: 'integer',
              example: 450
            },
            totalCalories: {
              type: 'integer',
              example: 3750
            },
            totalDistance: {
              type: 'number',
              example: 75.5
            },
            activitiesByType: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  count: { type: 'integer' },
                  totalDuration: { type: 'integer' },
                  totalCalories: { type: 'integer' },
                  totalDistance: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJSDoc(options);