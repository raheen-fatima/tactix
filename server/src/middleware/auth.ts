import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { verifyAuthToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: IUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.[env.COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({ error: 'Account no longer exists' });
      return;
    }

    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
