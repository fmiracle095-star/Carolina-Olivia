import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireOwner } from '../middleware/auth';

export const mellyRouter = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

mellyRouter.post('/chat', authenticate, requireOwner, (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  // The AI Router is merely on standby. Provider is not configured.
  return res.json({
    reply: '[SECURE GATEWAY] AI Router is STANDBY. Provider adapters are NOT CONFIGURED.',
    type: 'text'
  });
});
