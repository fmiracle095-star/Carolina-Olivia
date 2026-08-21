import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';

export const toolsRouter = Router();

toolsRouter.get('/', authenticate, requireOwner, (req, res) => {
  res.json({
    tools: [
      { id: 'web_search', description: 'Real-time Google search grounding' },
      { id: 'code_sandbox', description: 'Secure isolated code execution' },
      { id: 'terminal_bridge', description: 'Termux / Kali execution bridge' }
    ]
  });
});
