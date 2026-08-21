import { 
  NormalizedAIRequest, 
  NormalizedAIResponse, 
  NormalizedAIChunk, 
  ProviderHealth 
} from '../types/ai';

export class AIProviderError extends Error {
  public readonly isRetryable: boolean;
  public readonly statusCode?: number;
  public readonly errorCode: string;

  constructor(message: string, options?: { isRetryable?: boolean; statusCode?: number; errorCode?: string }) {
    super(message);
    this.name = 'AIProviderError';
    this.isRetryable = options?.isRetryable ?? false;
    this.statusCode = options?.statusCode;
    this.errorCode = options?.errorCode || 'PROVIDER_ERROR';
  }
}

export interface ProviderAdapter {
  slug: string;
  name: string;
  healthCheck(): Promise<ProviderHealth>;
  generate(request: NormalizedAIRequest): Promise<NormalizedAIResponse>;
  stream?(request: NormalizedAIRequest): AsyncIterable<NormalizedAIChunk>;
}
