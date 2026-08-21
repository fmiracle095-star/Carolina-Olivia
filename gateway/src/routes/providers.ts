import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';

export const providersRouter = Router();

providersRouter.get('/', authenticate, requireOwner, (req, res) => {
  res.json({
    providers: [
      { id: 'google', name: 'Google Gemini AI', status: 'ready', supported_capabilities: ['chat.generate', 'vision.analyze'] },
      { id: 'openai', name: 'OpenAI', status: 'unconfigured', supported_capabilities: ['chat.generate'] },
      { id: 'anthropic', name: 'Anthropic', status: 'unconfigured', supported_capabilities: ['chat.generate'] },
      { id: 'local', name: 'Local Runtime', status: 'standby', supported_capabilities: ['chat.generate'] }
    ]
  });
});
