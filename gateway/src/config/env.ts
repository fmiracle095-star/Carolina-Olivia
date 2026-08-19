import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8080'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_JWT_SECRET: z.string().min(1).default('placeholder-jwt-secret'),
  OWNER_UUID: z.string().uuid().default('00000000-0000-0000-0000-000000000000'),
  ENCRYPTION_KEY: z.string().length(64).regex(/^[0-9a-fA-F]+$/).default('a'.repeat(64)),
  TERMUX_AUTH_SECRET: z.string().min(16).default('placeholder-termux-secret-12345'),
  FRONTEND_ORIGIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
