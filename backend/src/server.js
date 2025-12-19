/**
 * Express Server Configuration
 * Main application entry point with security and error handling
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import usersRoutes from './routes/users.js';
import locationsRoutes from './routes/locations.js';
import teachersRoutes from './routes/teachers.js';
import classesRoutes from './routes/classes.js';
import studentsRoutes from './routes/students.js';
import sessionsRoutes from './routes/sessions.js';
import attendanceRoutes from './routes/attendance.js';
import scoresRoutes from './routes/scores.js';
import behaviorsRoutes from './routes/behaviors.js';
import studentInsightsRoutes from './routes/studentInsights.js';
import syncRoutes from './routes/sync.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  helmetConfig,
  // authRateLimiter, // Disabled for E2E testing
  // apiRateLimiter, // Disabled for E2E testing
  corsOptions,
  requestLogger,
  sanitizeInput
} from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmetConfig);
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// General API rate limiting - Disabled for E2E testing
// app.use('/api', apiRateLimiter);

// Public routes (no authentication required)
// Rate limiting disabled for E2E testing
// app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth', authRoutes);

// API Documentation (public)
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Insight EDU API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Protected routes (authentication required)
app.use('/api/settings', authenticate, settingsRoutes);
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/locations', authenticate, locationsRoutes);
app.use('/api/teachers', authenticate, teachersRoutes);
app.use('/api/classes', authenticate, classesRoutes);
app.use('/api/students', authenticate, studentsRoutes);
app.use('/api/sessions', authenticate, sessionsRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/scores', authenticate, scoresRoutes);
app.use('/api/behaviors', authenticate, behaviorsRoutes);
app.use('/api/student-insights', authenticate, studentInsightsRoutes);
app.use('/api/sync', authenticate, syncRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handling middleware - must be last
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
export { server };

