import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ephemeralDevSecret = crypto.randomBytes(32).toString('hex');

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || ephemeralDevSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  COOKIE_NAME: 'tactix_token',
};
