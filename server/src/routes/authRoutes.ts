import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getMe,
  guestAuth,
  guestSchema,
  login,
  loginSchema,
  logout,
  register,
  registerSchema,
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/guest', authLimiter, validateBody(guestSchema), guestAuth);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
