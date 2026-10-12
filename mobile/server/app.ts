import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';
import apiRoutes from './routes';
import { successResponse } from './utils/response';

export const app = express();

// Middlewares
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check
app.get('/health', (req, res) => {
  return successResponse(res, 'PALTI FX API Server is operational', {
    status: 'online',
    version: '1.0.0',
    env: config.nodeEnv,
    time: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);
