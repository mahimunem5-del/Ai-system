import express from 'express';
import cors from 'cors';
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

// Validate configuration on initialization
validateConfig();

const app = express();
const PORT = config.port;

// Security & Strict CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.allowedOrigins.includes(origin) || (config.cors.allowNullOrigin && origin === 'null')) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request ID & Safe Payload Limit Protection (50mb for multimodal vision and document attachments)
app.use(requestIdMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Route Mounts
app.use('/api', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chat', compareRouter);
app.use('/api/history', historyRouter);
app.use('/api', historyRouter); // Preserves /api/conversations aliases
app.use('/api/files', filesRouter);
app.use('/api/generate-image', imageRouter);
app.use('/api/images', imageRouter);

// Centralized 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`[Mestrio Engine Core] Server listening on port ${PORT} (${config.env})`);
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
