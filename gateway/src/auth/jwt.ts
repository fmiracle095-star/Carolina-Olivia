import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface SupabaseJwtPayload {
  sub: string;
  aud: string;
  exp: number;
  iss?: string;
  [key: string]: any;
}

export function verifySupabaseToken(token: string): SupabaseJwtPayload {
  // DOCUMENTATION:
  // This implementation strictly supports legacy HS256 / shared-secret JWTs
  // by depending on SUPABASE_JWT_SECRET.
  // It does NOT support asymmetric signing/JWKS (RS256).
  // Do not assume universal Supabase compatibility without verifying the project
  // signing method.
  
  const supabaseUrl = new URL(env.SUPABASE_URL);
  const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

  return jwt.verify(token, env.SUPABASE_JWT_SECRET, {
    algorithms: ['HS256'],
    audience: 'authenticated',
    issuer: expectedIssuer
  }) as SupabaseJwtPayload;
}
