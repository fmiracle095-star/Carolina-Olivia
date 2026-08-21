import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';

export const modelsRouter = Router();

modelsRouter.get('/', authenticate, requireOwner, (req, res) => {
  res.json({
    models: [
      { id: 'gemini-2.5-flash', provider: 'google', type: 'remote', context_window: 128000 },
      { id: 'grok-3', provider: 'grok', type: 'remote', context_window: 131072 },
      { id: 'llama-3-8b', provider: 'local', type: 'local', context_window: 8192 }
    ]
  });
});
