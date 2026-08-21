import { ProviderAdapter, AIProviderError } from './base';
import { 
  NormalizedAIRequest, 
  NormalizedAIResponse, 
  NormalizedAIChunk, 
  ProviderHealth 
} from '../types/ai';
import { env } from '../../config/env';

export class GrokProviderAdapter implements ProviderAdapter {
  public readonly slug = 'grok';
  public readonly name = 'xAI Grok';
  private readonly baseUrl = 'https://api.x.ai/v1';

  private getApiKey(): string {
    return env.getGrokApiKey();
  }

  async healthCheck(): Promise<ProviderHealth> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        status: 'offline',
        message: 'Grok API key is not configured on the server',
        checkedAt: new Date().toISOString(),
      };
    }

    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        return {
          status: 'healthy',
          latencyMs,
          checkedAt: new Date().toISOString(),
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          status: 'offline',
          latencyMs,
          message: 'Invalid or unauthorized Grok API credentials',
          checkedAt: new Date().toISOString(),
        };
      } else if (response.status === 429) {
        return {
          status: 'degraded',
          latencyMs,
          message: 'Grok API rate limit exceeded',
          checkedAt: new Date().toISOString(),
        };
      } else {
        return {
          status: 'degraded',
          latencyMs,
          message: `Grok API responded with status ${response.status}`,
          checkedAt: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'offline',
        latencyMs,
        message: err?.name === 'TimeoutError' ? 'Connection timeout to Grok API' : 'Unable to connect to Grok API',
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async generate(request: NormalizedAIRequest): Promise<NormalizedAIResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new AIProviderError('Grok API key is not configured on the server', {
        statusCode: 503,
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        isRetryable: false,
      });
    }

    const start = performance.now();
    const model = request.model || 'grok-2-latest';
    const requestId = request.requestId || crypto.randomUUID();

    const payload: Record<string, any> = {
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
    };

    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err: any) {
      const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout');
      throw new AIProviderError(isTimeout ? 'Request to Grok timed out' : 'Network error contacting Grok provider', {
        statusCode: 504,
        errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        isRetryable: true,
      });
    }

    const latencyMs = Math.round(performance.now() - start);

    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        // Not JSON
      }

      const errMsg = errorBody?.error?.message || `Grok API error (HTTP ${response.status})`;

      if (response.status === 401 || response.status === 403) {
        throw new AIProviderError('Invalid Grok API credentials', {
          statusCode: 401,
          errorCode: 'AUTHENTICATION_FAILED',
          isRetryable: false,
        });
      }

      if (response.status === 429) {
        throw new AIProviderError('Grok API rate limit exceeded', {
          statusCode: 429,
          errorCode: 'RATE_LIMITED',
          isRetryable: true,
        });
      }

      if (response.status === 400 || response.status === 422) {
        throw new AIProviderError(`Invalid request: ${errMsg}`, {
          statusCode: 400,
          errorCode: 'INVALID_REQUEST',
          isRetryable: false,
        });
      }

      if (response.status >= 500) {
        throw new AIProviderError(`Grok server error (${response.status})`, {
          statusCode: 502,
          errorCode: 'PROVIDER_UNAVAILABLE',
          isRetryable: true,
        });
      }

      throw new AIProviderError(errMsg, {
        statusCode: response.status,
        errorCode: 'PROVIDER_ERROR',
        isRetryable: response.status >= 500,
      });
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || '';
    const finishReason = choice?.finish_reason || 'stop';

    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const totalTokens = data.usage?.total_tokens ?? (inputTokens + outputTokens);

    return {
      requestId,
      provider: this.slug,
      model: data.model || model,
      text,
      finishReason,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
      latencyMs,
    };
  }

  async *stream(request: NormalizedAIRequest): AsyncIterable<NormalizedAIChunk> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new AIProviderError('Grok API key is not configured on the server', {
        statusCode: 503,
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        isRetryable: false,
      });
    }

    const model = request.model || 'grok-2-latest';
    const requestId = request.requestId || crypto.randomUUID();

    const payload: Record<string, any> = {
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      stream: true,
    };

    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      throw new AIProviderError('Failed to initiate Grok stream', {
        statusCode: 504,
        errorCode: 'NETWORK_ERROR',
        isRetryable: true,
      });
    }

    if (!response.ok || !response.body) {
      throw new AIProviderError(`Grok streaming failed with status ${response.status}`, {
        statusCode: response.status,
        errorCode: 'STREAM_FAILED',
        isRetryable: response.status >= 500 || response.status === 429,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            yield {
              requestId,
              provider: this.slug,
              model,
              deltaText: '',
              isComplete: true,
              finishReason: 'stop',
            };
            return;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content || '';
              const finishReason = json.choices?.[0]?.finish_reason;
              const isComplete = Boolean(finishReason);

              yield {
                requestId,
                provider: this.slug,
                model: json.model || model,
                deltaText: delta,
                isComplete,
                finishReason: finishReason || undefined,
              };
            } catch {
              // Ignore unparseable lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
