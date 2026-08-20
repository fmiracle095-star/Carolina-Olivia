import { Router, Request } from 'express';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';

export const systemRouter = Router();

systemRouter.get('/status', authenticate, (req: Request, res) => {
  const user = (req as any).user;
  const isOwner = !!(user && user.sub && user.sub === env.OWNER_UUID);

  return res.json({
    database: "NOT CONNECTED",
    vault: "NOT CONFIGURED",
    aiRouter: "STANDBY",
    provider: "NOT CONFIGURED",
    termux: "UNAVAILABLE",
    isOwner: isOwner
  });
});
