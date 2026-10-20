import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { env } from '../config/env';

export interface AuthTokenPayload {
  userId: string;
  username: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
    throw new Error('Invalid token payload');
  }
  return {
    userId: String(decoded.userId),
    username: String(decoded.username ?? ''),
  };
}

function isSecureContext(req?: Request): boolean {
  if (req) {
    if (req.secure) return true;
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (typeof forwardedProto === 'string' && forwardedProto.split(',')[0].trim() === 'https') {
      return true;
    }
    return false;
  }
  return env.NODE_ENV === 'production';
}

export function setAuthCookie(res: Response, token: string, req?: Request): void {
  const secure = isSecureContext(req);
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response, req?: Request): void {
  const secure = isSecureContext(req);
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
  });
}

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}
