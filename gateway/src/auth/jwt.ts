import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export interface SupabaseJwtPayload {
  sub: string;
  aud?: string;
  exp?: number;
  iss?: string;
  [key: string]: any;
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY || 'placeholder-anon-key', {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  // 1. Try local verification (supports HS256 with SUPABASE_JWT_SECRET)
  try {
    const supabaseUrl = new URL(env.SUPABASE_URL);
    const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

    const payload = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256', 'ES256', 'RS256'],
      audience: 'authenticated',
      issuer: expectedIssuer
    }) as SupabaseJwtPayload;

    if (payload && payload.sub) {
      return payload;
    }
  } catch (localErr: any) {
    if (localErr?.name === 'TokenExpiredError') {
      throw localErr;
    }
    // Fall back to Supabase Auth API verification for asymmetric tokens (ES256/RS256)
  }

  // 2. Fall back to Supabase Auth getUser() verification (supports all Supabase token signing methods)
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Invalid or expired Supabase token');
  }

  return {
    ...user,
    sub: user.id,
    aud: 'authenticated',
    email: user.email,
  };
}

