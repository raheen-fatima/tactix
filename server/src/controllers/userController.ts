import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';

const ALLOWED_AVATARS = new Set([
  'shield-emerald',
  'knight-amber',
  'viper-cyan',
  'rook-slate',
  'blade-crimson',
  'orbit-gold',
]);

export const updateProfileSchema = z.object({
  avatar: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(160, 'Bio must be 160 characters or less').optional(),
  preferences: z
    .object({
      soundEnabled: z.boolean().optional(),
      snakeSpeed: z.enum(['normal', 'fast']).optional(),
    })
    .optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(72, 'New password must be at most 72 characters'),
});

export async function getProfileByUsername(req: Request, res: Response): Promise<void> {
  const username = String(req.params.username || '').trim().toLowerCase();
  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  const user = await User.findOne({ usernameLower: username });
  if (!user) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  res.json({ user: user.toPublicProfile() });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { avatar, bio, preferences } = req.body as z.infer<typeof updateProfileSchema>;

  if (avatar !== undefined) {
    if (!ALLOWED_AVATARS.has(avatar)) {
      res.status(400).json({ error: 'Invalid avatar selection' });
      return;
    }
    req.user.avatar = avatar;
  }

  if (bio !== undefined) {
    req.user.bio = bio;
  }

  if (preferences) {
    if (preferences.soundEnabled !== undefined) {
      req.user.preferences.soundEnabled = preferences.soundEnabled;
    }
    if (preferences.snakeSpeed !== undefined) {
      req.user.preferences.snakeSpeed = preferences.snakeSpeed;
    }
  }

  await req.user.save();
  res.json({ user: req.user.toPublicProfile() });
}

export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { currentPassword, newPassword } = req.body as z.infer<typeof updatePasswordSchema>;
  const userWithHash = await User.findById(req.user._id).select('+passwordHash');
  if (!userWithHash) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  userWithHash.passwordHash = await bcrypt.hash(newPassword, 10);
  await userWithHash.save();
  res.json({ success: true });
}

export async function searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = String(req.query.q || '').trim().toLowerCase();
  const filter: Record<string, unknown> = {
    isGuest: { $ne: true },
  };

  if (req.userId) {
    filter._id = { $ne: req.userId };
  }

  if (query.length > 0) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.usernameLower = { $regex: `^${escaped}` };
  }

  const users = await User.find(filter)
    .sort({ status: 1, 'statistics.wins': -1 })
    .limit(12);

  res.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      avatar: u.avatar,
      status: u.status,
      totalGames: u.statistics.totalGames,
      wins: u.statistics.wins,
    })),
  });
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const game = String(req.query.game || 'overall');

  let sortField: Record<string, 1 | -1> = {
    'statistics.wins': -1,
    'statistics.totalGames': -1,
  };

  if (game === 'tic-tac-toe') {
    sortField = { 'statistics.games.ticTacToe.wins': -1, 'statistics.games.ticTacToe.played': -1 };
  } else if (game === 'snake') {
    sortField = {
      'statistics.games.snake.wins': -1,
      'statistics.games.snake.highScore': -1,
    };
  } else if (game === 'rock-paper-scissors') {
    sortField = {
      'statistics.games.rockPaperScissors.wins': -1,
      'statistics.games.rockPaperScissors.played': -1,
    };
  }

  const users = await User.find({ isGuest: { $ne: true } }).sort(sortField).limit(50);

  const entries = users.map((u, idx) => {
    const publicProfile = u.toPublicProfile();
    return {
      rank: idx + 1,
      id: publicProfile.id,
      username: publicProfile.username,
      avatar: publicProfile.avatar,
      status: publicProfile.status,
      statistics: publicProfile.statistics,
    };
  });

  res.json({ leaderboard: entries });
}
