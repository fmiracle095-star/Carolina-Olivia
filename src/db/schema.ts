import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['owner', 'user']);
export const permissionLevelEnum = pgEnum('permission_level', ['safe', 'controlled', 'critical']);

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Supabase Auth user ID (UUID)
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // local, cloud, custom
  endpoint: text('endpoint'),
  enabled: boolean('enabled').default(false).notNull(),
  priority: integer('priority').notNull(),
  capabilities: text('capabilities').notNull(), // JSON string array
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const providerCredentials = pgTable('provider_credentials', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  encryptedKey: text('encrypted_key').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
});

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  name: text('name').notNull(), // e.g. "llama-3-8b"
  identifier: text('identifier').notNull(), // actual model ID for API
  status: text('status').notNull(), // Available, Loaded, Ready
  isDefault: boolean('is_default').default(false).notNull(),
});

export const commandRegistry = pgTable('command_registry', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  scriptPath: text('script_path').notNull(),
  permissionLevel: permissionLevelEnum('permission_level').notNull(),
});
