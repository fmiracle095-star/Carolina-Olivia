export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NormalizedAIRequest {
  model?: string;
  messages: ChatMessage[];
  capability: string; // 'chat.generate' | 'chat.stream'
  temperature?: number;
  maxTokens?: number;
  preferredModel?: string | null;
  preferredProvider?: string | null;
  routingPolicy?: 'balanced' | 'best_quality' | 'fastest' | 'cheapest' | 'local_first' | 'cloud_first' | string;
  conversationId?: string | null;
  requestId?: string;
  stream?: boolean;
}

export interface NormalizedUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface NormalizedAIResponse {
  requestId: string;
  provider: string;
  model: string;
  text: string;
  finishReason?: string;
  usage?: NormalizedUsage;
  latencyMs?: number;
  orchestration?: {
    intent: string;
    complexity: string;
    requiredCapabilities: string[];
    executionPlan?: any;
    fallbackCount?: number;
    events?: any[];
  };
}

export interface NormalizedAIChunk {
  requestId: string;
  provider: string;
  model: string;
  deltaText: string;
  isComplete: boolean;
  finishReason?: string;
  usage?: NormalizedUsage;
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'offline' | 'disabled' | 'unknown';
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}
