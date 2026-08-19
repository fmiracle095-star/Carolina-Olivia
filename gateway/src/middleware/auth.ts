import { Request, Response, NextFunction } from 'express';
import { verifySupabaseToken } from '../auth/jwt';
import { env } from '../config/env';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifySupabaseToken(token);
    (req as any).user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !user.sub) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  if (user.sub !== env.OWNER_UUID) {
    return res.status(403).json({ error: 'Forbidden: Owner access required' });
  }

  next();
}
