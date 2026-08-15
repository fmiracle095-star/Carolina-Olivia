import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { mellyRouter } from './api/melly';
import { db } from './db';
import { users } from './db/schema';
import { eq, count } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.post('/api/auth/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { id, name, email } = req.body;

      if (id !== user.id) {
        return res.status(403).json({ error: 'ID mismatch' });
      }

      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.id, user.id));
      if (existing.length > 0) {
        return res.json(existing[0]);
      }

      // Determine role
      const totalUsers = await db.select({ value: count() }).from(users);
      const userCount = totalUsers[0]?.value ?? 0;
      const assignedRole = (userCount === 0 || email === 'miraclefranize3@gmail.com') ? 'owner' : 'user';

      const newProfile = {
        id: user.id,
        name: name || user.user_metadata?.name || email.split('@')[0] || 'User',
        email: email || user.email || '',
        role: assignedRole
      };

      const result = await db.insert(users).values(newProfile).returning();
      res.json(result[0]);
    } catch (err) {
      console.error('Error in /api/auth/profile:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.use('/api/melly', mellyRouter);

  
  // Basic health check
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', service: 'Carolina Portal' });
  });

  // Vite middleware for development or Static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
