-- Migration: Phase 2 AI Router, Provider Registry, Model Registry, Usage & Quotas
-- Author: Carolina-Olivia Architecture Phase 2

-- 1. Providers Table
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'remote', -- 'remote' | 'local'
  base_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'unknown', -- 'healthy' | 'degraded' | 'offline' | 'disabled' | 'unknown'
  auth_type TEXT NOT NULL DEFAULT 'bearer', -- 'bearer' | 'api_key' | 'custom' | 'none'
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Models Table
CREATE TABLE IF NOT EXISTS public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  model_identifier TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  context_window INTEGER,
  local_or_remote TEXT NOT NULL DEFAULT 'remote', -- 'local' | 'remote'
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy' | 'degraded' | 'offline' | 'unknown'
  input_cost NUMERIC(10, 6) DEFAULT 0,
  output_cost NUMERIC(10, 6) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_models_provider_identifier UNIQUE (provider_id, model_identifier)
);

-- 3. Model Capabilities Table
CREATE TABLE IF NOT EXISTS public.model_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  capability TEXT NOT NULL, -- e.g. 'chat.generate', 'chat.stream'
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_model_capabilities UNIQUE (model_id, capability)
);

-- 4. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id TEXT,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  capability TEXT NOT NULL,
  request_id TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'success' | 'failed' | 'timeout' | 'rate_limited' | 'rejected'
  error_code TEXT,
  estimated_cost NUMERIC(10, 6) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Routing Policies Table
CREATE TABLE IF NOT EXISTS public.routing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  strategy TEXT NOT NULL, -- 'balanced' | 'best_quality' | 'fastest' | 'cheapest' | 'local_first' | 'cloud_first'
  enabled BOOLEAN NOT NULL DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. User AI Limits / Quota Table
CREATE TABLE IF NOT EXISTS public.user_ai_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  daily_requests INTEGER,
  daily_tokens INTEGER,
  monthly_tokens INTEGER,
  enabled BOOLEAN NOT NULL DEFAULT true,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.providers(slug);
CREATE INDEX IF NOT EXISTS idx_models_provider_id ON public.models(provider_id);
CREATE INDEX IF NOT EXISTS idx_models_enabled ON public.models(enabled);
CREATE INDEX IF NOT EXISTS idx_models_status ON public.models(status);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_model_id ON public.model_capabilities(model_id);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_capability ON public.model_capabilities(capability);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_id ON public.ai_usage(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model_id ON public.ai_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_request_id ON public.ai_usage(request_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_user_id ON public.user_ai_limits(user_id);

-- RLS Security Configuration
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_limits ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Allow authenticated read providers" ON public.providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read models" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read model_capabilities" ON public.model_capabilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read routing_policies" ON public.routing_policies FOR SELECT TO authenticated USING (true);

-- Usage policies: users can read their own usage logs
CREATE POLICY "Users read own ai_usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Quota limits: users read own limits
CREATE POLICY "Users read own limits" ON public.user_ai_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Seed Initial Data: Grok Provider
INSERT INTO public.providers (id, name, slug, type, base_url, enabled, status, auth_type, capabilities, metadata)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'xAI Grok',
  'grok',
  'remote',
  'https://api.x.ai/v1',
  true,
  'healthy',
  'bearer',
  '["chat.generate", "chat.stream"]'::jsonb,
  '{"vendor": "xAI", "description": "Official xAI Grok provider adapter"}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Seed Initial Data: Grok Models
INSERT INTO public.models (id, provider_id, name, slug, model_identifier, display_name, description, context_window, local_or_remote, enabled, priority, status, input_cost, output_cost, metadata)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'grok-2-latest',
  'grok-2-latest',
  'grok-2-latest',
  'Grok 2 Latest',
  'State-of-the-art reasoning and chat model from xAI',
  131072,
  'remote',
  true,
  10,
  'healthy',
  0.000002,
  0.000010,
  '{"recommended": true}'::jsonb
) ON CONFLICT (provider_id, model_identifier) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO public.models (id, provider_id, name, slug, model_identifier, display_name, description, context_window, local_or_remote, enabled, priority, status, input_cost, output_cost, metadata)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'grok-beta',
  'grok-beta',
  'grok-beta',
  'Grok Beta',
  'High capability conversational AI model from xAI',
  131072,
  'remote',
  true,
  5,
  'healthy',
  0.000005,
  0.000015,
  '{}'::jsonb
) ON CONFLICT (provider_id, model_identifier) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Seed Capabilities for Grok Models
INSERT INTO public.model_capabilities (model_id, capability, enabled)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'chat.generate', true),
  ('20000000-0000-0000-0000-000000000001', 'chat.stream', true),
  ('20000000-0000-0000-0000-000000000002', 'chat.generate', true),
  ('20000000-0000-0000-0000-000000000002', 'chat.stream', true)
ON CONFLICT (model_id, capability) DO NOTHING;

-- Seed Routing Policies
INSERT INTO public.routing_policies (id, name, slug, strategy, enabled, configuration)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Balanced Routing', 'balanced', 'balanced', true, '{"weight_priority": 0.5, "weight_latency": 0.5}'::jsonb),
  ('30000000-0000-0000-0000-000000000002', 'Best Quality Routing', 'best_quality', 'best_quality', true, '{"prefer_highest_priority": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000003', 'Fastest Response', 'fastest', 'fastest', true, '{"prefer_lowest_latency": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000004', 'Cost Optimized', 'cheapest', 'cheapest', true, '{"prefer_lowest_cost": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000005', 'Local Priority', 'local_first', 'local_first', true, '{"prefer_local": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000006', 'Cloud First', 'cloud_first', 'cloud_first', true, '{"prefer_cloud": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
