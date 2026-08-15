import { createServerClient } from '@supabase/ssr';
import { Request, Response } from 'express';

export const createClient = (req: Request, res: Response) =>
  createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: any) {
          res.cookie(name, value, options);
        },
        remove(name: string, options: any) {
          res.clearCookie(name, options);
        },
      },
    }
  );
