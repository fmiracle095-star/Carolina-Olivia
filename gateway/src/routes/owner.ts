import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';
import { env } from '../config/env';

export const ownerRouter = Router();

ownerRouter.get('/profile', authenticate, requireOwner, (req: any, res) => {
  res.json({
    role: 'Overseer',
    uuid: env.OWNER_UUID,
    permissions: ['all'],
    agent_status: 'standby'
  });
});
