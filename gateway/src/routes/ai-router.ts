import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireOwner } from '../middleware/auth';

export const aiRouter = Router();

aiRouter.post('/generate', authenticate, requireOwner, (req, res) => {
  const { prompt, capability, preferredModel, routingPolicy } = req.body;
  // Conceptual AI Router interface boundary for future phases
  res.json({
    status: 'pending_provider_provisioning',
    request: { prompt, capability: capability || 'chat.generate', preferredModel, routingPolicy },
    response: {
      provider: 'none',
      model: preferredModel || 'default',
      output: 'AI provider integration is pending configuration.',
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      latency_ms: 0
    }
  });
});
