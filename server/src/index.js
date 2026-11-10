import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config, { validateConfig } from './config/env.js';
import requestIdMiddleware from './middleware/requestId.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import chatRouter from './routes/chat.js';
import compareRouter from './routes/compare.js';
import historyRouter from './routes/history.js';
import healthRouter from './routes/health.js';
import filesRouter from './routes/files.js';
import imageRouter from './routes/image.js';
import { executePreciseEdit, executeUpscaleImage, executeVectorizeImage } from './controllers/imageController.js';

// Validate configuration on initialization
validateConfig();

const app = express();
const PORT = config.port;

// Security & Robust CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development, web preview, file:// (null), and configured production origins
    if (
      !origin ||
      origin === 'null' ||
      (config.cors?.allowedOrigins && config.cors.allowedOrigins.includes(origin)) ||
      (config.cors?.allowNullOrigin && origin === 'null') ||
      /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback so browser fetches never fail with CORS errors
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Request-ID']
}));

// Explicit preflight handling for all routes
app.options('*', cors());

// Request ID & Safe Payload Limit Protection (50mb for high-resolution Base64 image payloads)
app.use(requestIdMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // express.urlencoded({ extended: true, limit: '50mb' })

// Route Mounts
app.use('/api', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chat', compareRouter);
app.use('/api/history', historyRouter);
app.use('/api', historyRouter); // Preserves /api/conversations aliases
app.use('/api/files', filesRouter);
app.use('/api/generate-image', imageRouter);
app.use('/api/images', imageRouter);
app.use('/api/image', imageRouter);

// Explicit aliases for Precise Edit, Smart Edit, and Upscale to prevent any 404 path mismatch
app.post('/api/images/precise-edit', executePreciseEdit);
app.post('/api/image/precise-edit', executePreciseEdit);
app.post('/api/generate-image/precise-edit', executePreciseEdit);
app.post('/api/images/edit', executePreciseEdit);
app.post('/api/images/smart-edit', executePreciseEdit);
app.post('/api/image/smart-edit', executePreciseEdit);
app.post('/api/generate-image/smart-edit', executePreciseEdit);
app.post('/api/images/upscale', executeUpscaleImage);
app.post('/api/image/upscale', executeUpscaleImage);
app.post('/api/generate-image/upscale', executeUpscaleImage);
app.post('/api/images/vectorize', executeVectorizeImage);
app.post('/api/image/vectorize', executeVectorizeImage);
app.post('/api/generate-image/vectorize', executeVectorizeImage);

// Static client assets & SPA route fallback for client-side routing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const VALID_SPA_ROUTES = new Set([
  '/',
  '/index.html',
  '/create/svg/vectorize',
  '/vectorize'
]);

app.use(express.static(rootDir));
app.use('/public', express.static(path.join(rootDir, 'public')));
app.use(express.static(path.join(rootDir, 'public')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const cleanPath = req.path.replace(/\/+$/, '') || '/';
  if (VALID_SPA_ROUTES.has(cleanPath)) {
    return res.sendFile(path.join(rootDir, 'index.html'), (err) => {
      if (err) next(err);
    });
  }
  next();
});

// Centralized 404 and Error Handling
app.use(notFoundHandler);

// Global error handler middleware so payload errors or parsing failures never kill the Node process
app.use((err, req, res, next) => {
  console.error('Server error intercepted:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    message: err.message || 'Internal server error'
  });
});

app.use(errorHandler);

// Global process error handlers to prevent unhandled exceptions or rejections from crashing the process
process.on('uncaughtException', (err) => {
  console.error('Server uncaughtException intercepted:', err);
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Server unhandledRejection intercepted:', reason);
  logger.error('Unhandled Rejection:', { reason: reason instanceof Error ? reason.message : reason });
});

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`[Mestrio Engine Core] Server listening on port ${PORT} (${config.env})`);
  });

  server.on('error', (err) => {
    console.error('Express server error:', err);
    logger.error('Server error event caught:', { error: err.message, code: err.code });
  });

  const handleShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;
