import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireOwner } from '../middleware/auth';
import { env } from '../config/env';
import { usageService } from '../ai/usage/usage-service';
import { dbStore } from '../ai/db/store';

export const usageRouter = Router();

const limitsUpdateSchema = z.object({
  daily_requests: z.number().int().min(0).nullable().optional(),
  daily_tokens: z.number().int().min(0).nullable().optional(),
  monthly_tokens: z.number().int().min(0).nullable().optional(),
  enabled: z.boolean().optional(),
  configuration: z.record(z.string(), z.any()).optional(),
});

// GET /api/v1/usage - Current user usage overview and recent logs
usageRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || 'anonymous-user';
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);

    // If query requests a specific user and caller is owner, allow querying that user
    const targetUserId = (isOwner && typeof req.query.userId === 'string') ? req.query.userId : userId;

    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) : 50;
    const { summary, records } = await usageService.getUserUsage(targetUserId, { limit });

    return res.json({
      userId: targetUserId,
      summary,
      recent_logs: records,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve usage data' });
  }
});

// GET /api/v1/usage/summary - System-wide aggregated analytics (Owner only)
usageRouter.get('/summary', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10))) : 100;
    const overview = await usageService.getOwnerUsageSummary({ limit });

    return res.json({
      overview,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve usage summary' });
  }
});

// GET /api/v1/usage/limits - Get user AI limits and status
usageRouter.get('/limits', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || 'anonymous-user';
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);

    const limits = await dbStore.getUserLimits(userId);

    return res.json({
      userId,
      isOwner,
      limits: limits || {
        daily_requests: 100,
        daily_tokens: 200000,
        monthly_tokens: 5000000,
        enabled: true,
      },
      unlimited: isOwner,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve user limits' });
  }
});

// PUT /api/v1/usage/limits/:userId - Set user AI limits (Owner only)
usageRouter.put('/limits/:userId', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const parsed = limitsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid limits payload', details: parsed.error.issues });
    }

    const userId = String(req.params.userId);
    const updated = await dbStore.setUserLimits(userId, parsed.data);
    return res.json({
      status: 'success',
      limits: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update user limits' });
  }
});
