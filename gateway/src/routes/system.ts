import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const systemRouter = Router();

systemRouter.get('/status', authenticate, (req, res) => {
  return res.json({
    database: "NOT CONNECTED",
    vault: "NOT CONFIGURED",
    aiRouter: "STANDBY",
    provider: "NOT CONFIGURED",
    termux: "UNAVAILABLE"
  });
});
