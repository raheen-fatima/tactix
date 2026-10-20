import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { clearAuthCookie, setAuthCookie, signAuthToken, verifyAuthToken } from '../utils/jwt';

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
  avatar: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const guestSchema = z.object({
  nickname: z
    .string()
    .trim()
    .max(16)
    .optional(),
});

const ALLOWED_AVATARS = new Set([
  'shield-emerald',
  'knight-amber',
  'viper-cyan',
  'rook-slate',
  'blade-crimson',
  'orbit-gold',
]);

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password, avatar } = req.body as z.infer<typeof registerSchema>;
  const usernameLower = username.toLowerCase();

  const existingUser = await User.findOne({ usernameLower });
  if (existingUser) {
    res.status(409).json({ error: 'That username is already taken' });
    return;
  }

  const normalizedEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : undefined;
  if (normalizedEmail) {
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(409).json({ error: 'That email is already registered' });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const safeAvatar = avatar && ALLOWED_AVATARS.has(avatar) ? avatar : 'shield-emerald';

  const user = await User.create({
    username,
    usernameLower,
    email: normalizedEmail,
    passwordHash,
    isGuest: false,
    avatar: safeAvatar,
    status: 'online',
    lastSeen: new Date(),
  });

  const token = signAuthToken({
    userId: user._id.toString(),
    username: user.username,
  });

  setAuthCookie(res, token, req);

  res.status(201).json({
    user: user.toPublicProfile(),
    token,
  });
}

export async function guestAuth(req: Request, res: Response): Promise<void> {
  const { nickname } = req.body as z.infer<typeof guestSchema>;
  const sanitizedBase = (nickname || '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 12);
  const suffix = crypto.randomBytes(2).toString('hex');
  const username =
    sanitizedBase.length >= 3 ? `${sanitizedBase}_${suffix}` : `Guest_${suffix}`;

  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 8);
  const avatarList = Array.from(ALLOWED_AVATARS);
  const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];

  const user = await User.create({
    username,
    usernameLower: username.toLowerCase(),
    passwordHash,
    isGuest: true,
    avatar: randomAvatar,
    bio: 'Demo Guest Session',
    status: 'online',
    lastSeen: new Date(),
  });

  const token = signAuthToken({
    userId: user._id.toString(),
    username: user.username,
  });

  setAuthCookie(res, token, req);

  res.status(201).json({
    user: user.toPublicProfile(),
    token,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { identifier, password } = req.body as z.infer<typeof loginSchema>;
  const lowered = identifier.toLowerCase();

  const user = await User.findOne({
    $or: [{ usernameLower: lowered }, { email: lowered }],
  }).select('+passwordHash');

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  user.status = 'online';
  user.lastSeen = new Date();
  await user.save();

  const token = signAuthToken({
    userId: user._id.toString(),
    username: user.username,
  });

  setAuthCookie(res, token, req);

  res.json({
    user: user.toPublicProfile(),
    token,
  });
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.[env.COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }
    if (token) {
      const payload = verifyAuthToken(token);
      await User.updateOne(
        { _id: payload.userId },
        { $set: { status: 'offline', lastSeen: new Date() } }
      );
    }
  } catch {
    // Expired or invalid token should still allow clean logout
  }
  clearAuthCookie(res, req);
  res.json({ success: true });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: req.user.toPublicProfile() });
}
