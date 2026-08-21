import { ChatMessage, NormalizedAIRequest } from '../types/ai';

export type TaskIntent = 
  | 'conversation'
  | 'knowledge'
  | 'reasoning'
  | 'calculation'
  | 'coding'
  | 'creative'
  | 'translation'
  | 'summarization'
  | 'system'
  | 'owner_operation'
  | 'provider_management'
  | 'unsupported';

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface TaskAnalysis {
  intent: TaskIntent;
  complexity: TaskComplexity;
  requiredCapabilities: string[];
  reasoningSummary?: string;
  confidence: number;
  requiresGeneralAI: boolean;
}

export type RoutingPolicy = 'balanced' | 'best_quality' | 'fastest' | 'cheapest' | 'local_first' | 'cloud_first';

export interface ExecutionPlan {
  intent: TaskIntent;
  complexity: TaskComplexity;
  requiredCapabilities: string[];
  preferredPolicy: RoutingPolicy;
  preferredProvider?: string;
  preferredModel?: string;
  fallbackAllowed: boolean;
  requiresGeneralAI: boolean;
  summary?: string;
}

export type OrchestrationEventType =
  | 'REQUEST_RECEIVED'
  | 'ANALYZING'
  | 'PLANNING'
  | 'SELECTING_PROVIDER'
  | 'EXECUTING'
  | 'FALLBACK'
  | 'COMPLETED'
  | 'FAILED';

export interface OrchestrationEvent {
  id: string;
  requestId: string;
  type: OrchestrationEventType;
  timestamp: string;
  intent?: TaskIntent;
  complexity?: TaskComplexity;
  provider?: string;
  model?: string;
  latencyMs?: number;
  message?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  details?: Record<string, any>;
}

export interface OrchestrationResultMetadata {
  intent: TaskIntent;
  complexity: TaskComplexity;
  requiredCapabilities: string[];
  executionPlan: ExecutionPlan;
  fallbackCount: number;
  events: OrchestrationEvent[];
}
