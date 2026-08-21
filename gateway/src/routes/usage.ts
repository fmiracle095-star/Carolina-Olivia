import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';

export const usageRouter = Router();

usageRouter.get('/', authenticate, requireOwner, (req, res) => {
  res.json({
    usage_summary: {
      total_requests: 0,
      total_tokens: 0,
      estimated_cost_usd: 0.00,
      success_rate: 1.00
    }
  });
});
