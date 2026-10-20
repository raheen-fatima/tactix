import { Router } from 'express';
import {
  getLeaderboard,
  getProfileByUsername,
  searchUsers,
  updatePassword,
  updatePasswordSchema,
  updateProfile,
  updateProfileSchema,
} from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/search', requireAuth, searchUsers);
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.patch('/password', requireAuth, validateBody(updatePasswordSchema), updatePassword);
router.get('/:username', requireAuth, getProfileByUsername);

export default router;
