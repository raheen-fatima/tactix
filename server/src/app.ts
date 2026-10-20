import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ensureDatabaseConnected, isDatabaseReady } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import userRoutes from './routes/userRoutes';

export function createExpressApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const allowedOrigins = env.CLIENT_ORIGIN
    ? env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (origin.startsWith('http://localhost:') || origin.startsWith('https://')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      dbReady: isDatabaseReady(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', async (_req, _res, next) => {
    try {
      await ensureDatabaseConnected();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/matches', matchRoutes);

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  app.use(errorHandler);

  return app;
}
