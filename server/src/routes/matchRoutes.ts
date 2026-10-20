import { Router } from 'express';
import {
  cancelInviteLink,
  createInviteLink,
  getInvitations,
  getInviteLink,
  getMatchHistory,
  getPlatformOverview,
  getRoomDetails,
  joinInviteLink,
} from '../controllers/matchController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/overview', getPlatformOverview);
router.get('/history', requireAuth, getMatchHistory);
router.get('/invitations', requireAuth, getInvitations);
router.get('/rooms/:roomId', requireAuth, getRoomDetails);
router.post('/invite-links', requireAuth, createInviteLink);
router.get('/invite-links/:code', getInviteLink);
router.post('/invite-links/:code/join', requireAuth, joinInviteLink);
router.post('/invite-links/:code/cancel', requireAuth, cancelInviteLink);

export default router;
