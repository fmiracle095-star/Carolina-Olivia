export type ProviderType = 'remote' | 'local';
export type ProviderStatus = 'healthy' | 'degraded' | 'offline' | 'disabled' | 'unknown';
export type ProviderAuthType = 'bearer' | 'api_key' | 'custom' | 'none';

export interface ProviderRecord {
  id: string;
  name: string;
  slug: string;
  type: ProviderType;
  base_url: string | null;
  enabled: boolean;
  status: ProviderStatus;
  auth_type: ProviderAuthType;
  capabilities: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ModelLocation = 'local' | 'remote';
export type ModelStatus = 'healthy' | 'degraded' | 'offline' | 'unknown';

export interface ModelRecord {
  id: string;
  provider_id: string;
  name: string;
  slug: string;
  model_identifier: string;
  display_name: string;
  description: string | null;
  context_window: number | null;
  local_or_remote: ModelLocation;
  enabled: boolean;
  priority: number;
  status: ModelStatus;
  input_cost: number | null;
  output_cost: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ModelCapabilityRecord {
  id: string;
  model_id: string;
  capability: string;
  enabled: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export type AIUsageStatus = 'success' | 'failed' | 'timeout' | 'rate_limited' | 'rejected';

export interface AIUsageRecord {
  id: string;
  user_id: string;
  conversation_id: string | null;
  provider_id: string | null;
  model_id: string | null;
  capability: string;
  request_id: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  latency_ms: number | null;
  status: AIUsageStatus;
  error_code: string | null;
  estimated_cost: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type RoutingStrategy = 'balanced' | 'best_quality' | 'fastest' | 'cheapest' | 'local_first' | 'cloud_first';

export interface RoutingPolicyRecord {
  id: string;
  name: string;
  slug: string;
  strategy: RoutingStrategy;
  enabled: boolean;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserAILimitsRecord {
  id: string;
  user_id: string;
  daily_requests: number | null;
  daily_tokens: number | null;
  monthly_tokens: number | null;
  enabled: boolean;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}
