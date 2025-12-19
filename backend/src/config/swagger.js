/**
 * Swagger/OpenAPI Configuration
 * API documentation setup using swagger-jsdoc and swagger-ui-express
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Insight EDU API',
      version: '1.0.0',
      description: 'A comprehensive educational management system API for tracking student performance, attendance, behavior, and generating AI-powered insights.',
      contact: {
        name: 'Insight EDU Team',
        email: 'support@insightedu.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.insightedu.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Additional error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            role: {
              type: 'string',
              enum: ['HQ', 'TEACHER', 'PARENT'],
              description: 'User role',
            },
            must_change_password: {
              type: 'boolean',
              description: 'Whether user must change password on next login',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'admin@insightedu.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'Admin123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                role: {
                  type: 'string',
                  enum: ['HQ', 'TEACHER', 'PARENT'],
                },
                mustChangePassword: {
                  type: 'boolean',
                },
              },
            },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              format: 'password',
              description: 'Current password',
            },
            newPassword: {
              type: 'string',
              format: 'password',
              description: 'New password (min 8 chars, 1 uppercase, 1 number)',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Settings',
        description: 'Application settings endpoints',
      },
      {
        name: 'Teachers',
        description: 'Teacher management endpoints',
      },
      {
        name: 'Students',
        description: 'Student management endpoints',
      },
      {
        name: 'Classes',
        description: 'Class management endpoints',
      },
      {
        name: 'Sessions',
        description: 'Session management endpoints',
      },
      {
        name: 'Locations',
        description: 'Location management endpoints',
      },
      {
        name: 'Attendance',
        description: 'Attendance tracking endpoints',
      },
      {
        name: 'Scores',
        description: 'Score management endpoints',
      },
      {
        name: 'Behaviors',
        description: 'Behavior rating endpoints',
      },
      {
        name: 'Student Insights',
        description: 'AI-generated student insights endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

