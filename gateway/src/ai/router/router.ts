import crypto from 'crypto';
import { dbStore } from '../db/store';
import { adapterRegistry } from '../adapters/registry';
import { AIProviderError } from '../adapters/base';
import { quotaManager } from '../quotas/quota-manager';
import { usageService } from '../usage/usage-service';
import { 
  NormalizedAIRequest, 
  NormalizedAIResponse, 
  NormalizedAIChunk 
} from '../types/ai';
import { ModelRecord, ProviderRecord } from '../db/schema';

export interface RouterUserContext {
  userId: string;
  isOwner?: boolean;
}

export class AIRouter {
  async route(request: NormalizedAIRequest, context: RouterUserContext): Promise<NormalizedAIResponse> {
    const capability = request.capability || 'chat.generate';
    const requestId = request.requestId || crypto.randomUUID();
    const startTime = performance.now();

    // 1. Quota Check
    const quotaResult = await quotaManager.checkQuota(context.userId, context.isOwner);
    if (!quotaResult.allowed) {
      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        capability,
        requestId,
        status: 'rejected',
        errorCode: 'QUOTA_EXCEEDED',
        metadata: { reason: quotaResult.reason, limitType: quotaResult.limitType },
      });

      const err = new Error(quotaResult.reason || 'AI quota limit exceeded');
      (err as any).statusCode = 429;
      (err as any).errorCode = 'QUOTA_EXCEEDED';
      throw err;
    }

    // 2. Resolve Eligible Models and Providers
    const candidates = await this.resolveCandidates(request, capability);

    if (candidates.length === 0) {
      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        capability,
        requestId,
        latencyMs: Math.round(performance.now() - startTime),
        status: 'failed',
        errorCode: 'NO_AVAILABLE_MODELS',
        metadata: { reason: 'No eligible AI models or providers found' },
      });

      const err = new Error('No eligible AI models or providers are available for this request');
      (err as any).statusCode = 503;
      (err as any).errorCode = 'NO_AVAILABLE_MODELS';
      throw err;
    }

    // 3. Attempt Execution with Controlled Fallback
    let lastError: any = null;

    for (const candidate of candidates) {
      const { model, provider, adapter } = candidate;
      const attemptStart = performance.now();

      try {
        const response = await adapter.generate({
          ...request,
          model: model.model_identifier,
          requestId,
          capability,
        });

        const attemptLatency = Math.round(performance.now() - attemptStart);
        const inputTokens = response.usage?.inputTokens ?? 0;
        const outputTokens = response.usage?.outputTokens ?? 0;
        const totalTokens = response.usage?.totalTokens ?? (inputTokens + outputTokens);

        // Calculate estimated cost
        const inputCost = (model.input_cost ?? 0) * (inputTokens / 1000);
        const outputCost = (model.output_cost ?? 0) * (outputTokens / 1000);
        const estimatedCost = Number((inputCost + outputCost).toFixed(6));

        // Record successful usage
        await usageService.recordUsage({
          userId: context.userId,
          conversationId: request.conversationId,
          providerId: provider.id,
          modelId: model.id,
          capability,
          requestId,
          inputTokens,
          outputTokens,
          totalTokens,
          latencyMs: response.latencyMs || attemptLatency,
          status: 'success',
          estimatedCost,
          metadata: { policy: request.routingPolicy || 'balanced', modelIdentifier: model.model_identifier },
        });

        return {
          ...response,
          requestId,
          provider: provider.slug,
          model: model.model_identifier,
        };
      } catch (err: any) {
        lastError = err;
        const attemptLatency = Math.round(performance.now() - attemptStart);
        const isRetryable = err instanceof AIProviderError ? err.isRetryable : false;
        const statusCode = (err as any)?.statusCode || 500;
        const errorCode = (err as any)?.errorCode || 'EXECUTION_FAILED';

        // Record failed attempt
        await usageService.recordUsage({
          userId: context.userId,
          conversationId: request.conversationId,
          providerId: provider.id,
          modelId: model.id,
          capability,
          requestId,
          latencyMs: attemptLatency,
          status: statusCode === 429 ? 'rate_limited' : (statusCode === 504 ? 'timeout' : 'failed'),
          errorCode,
          metadata: { errorMessage: err?.message, isRetryable },
        });

        // If error is not retryable (e.g. invalid request, authentication error), stop trying fallbacks
        if (!isRetryable) {
          throw err;
        }
      }
    }

    // All candidates failed
    throw lastError || new Error('AI Router execution failed across all candidate providers');
  }

  async *streamRoute(request: NormalizedAIRequest, context: RouterUserContext): AsyncIterable<NormalizedAIChunk> {
    const capability = request.capability || 'chat.stream';
    const requestId = request.requestId || crypto.randomUUID();
    const startTime = performance.now();

    // 1. Quota Check
    const quotaResult = await quotaManager.checkQuota(context.userId, context.isOwner);
    if (!quotaResult.allowed) {
      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        capability,
        requestId,
        status: 'rejected',
        errorCode: 'QUOTA_EXCEEDED',
        metadata: { reason: quotaResult.reason, limitType: quotaResult.limitType },
      });

      const err = new Error(quotaResult.reason || 'AI quota limit exceeded');
      (err as any).statusCode = 429;
      (err as any).errorCode = 'QUOTA_EXCEEDED';
      throw err;
    }

    // 2. Resolve Candidates
    const candidates = await this.resolveCandidates(request, capability);
    if (candidates.length === 0) {
      const err = new Error('No eligible AI models or providers are available for this request');
      (err as any).statusCode = 503;
      (err as any).errorCode = 'NO_AVAILABLE_MODELS';
      throw err;
    }

    const primary = candidates[0];
    const { model, provider, adapter } = primary;

    if (!adapter.stream) {
      const err = new Error(`Provider adapter "${provider.slug}" does not support streaming`);
      (err as any).statusCode = 400;
      (err as any).errorCode = 'STREAMING_NOT_SUPPORTED';
      throw err;
    }

    let totalChars = 0;
    let finishReason = 'stop';

    try {
      for await (const chunk of adapter.stream({
        ...request,
        model: model.model_identifier,
        requestId,
        capability,
      })) {
        totalChars += chunk.deltaText?.length || 0;
        if (chunk.finishReason) finishReason = chunk.finishReason;
        yield {
          ...chunk,
          requestId,
          provider: provider.slug,
          model: model.model_identifier,
        };
      }

      // Record streaming usage estimate
      const latencyMs = Math.round(performance.now() - startTime);
      const estOutputTokens = Math.max(1, Math.round(totalChars / 4));
      const estInputTokens = Math.round(request.messages.reduce((acc, m) => acc + m.content.length, 0) / 4);
      const totalTokens = estInputTokens + estOutputTokens;

      const inputCost = (model.input_cost ?? 0) * (estInputTokens / 1000);
      const outputCost = (model.output_cost ?? 0) * (estOutputTokens / 1000);
      const estimatedCost = Number((inputCost + outputCost).toFixed(6));

      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        providerId: provider.id,
        modelId: model.id,
        capability,
        requestId,
        inputTokens: estInputTokens,
        outputTokens: estOutputTokens,
        totalTokens,
        latencyMs,
        status: 'success',
        estimatedCost,
        metadata: { streaming: true, modelIdentifier: model.model_identifier },
      });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        providerId: provider.id,
        modelId: model.id,
        capability,
        requestId,
        latencyMs,
        status: 'failed',
        errorCode: err?.errorCode || 'STREAM_ERROR',
        metadata: { errorMessage: err?.message },
      });
      throw err;
    }
  }

  private async resolveCandidates(request: NormalizedAIRequest, capability: string): Promise<Array<{
    model: ModelRecord;
    provider: ProviderRecord;
    adapter: any;
  }>> {
    const allProviders = await dbStore.getProviders(true);
    const providerMap = new Map(allProviders.map(p => [p.id, p]));

    const models = await dbStore.getModels({
      enabledOnly: true,
      capability,
    });

    const eligible: Array<{ model: ModelRecord; provider: ProviderRecord; adapter: any }> = [];

    for (const model of models) {
      const provider = providerMap.get(model.provider_id);
      if (!provider || !provider.enabled || provider.status === 'disabled') {
        continue;
      }

      const adapter = adapterRegistry.get(provider.slug);
      if (!adapter) {
        continue;
      }

      // Check preferred provider if specified
      if (request.preferredProvider && provider.slug !== request.preferredProvider && provider.id !== request.preferredProvider) {
        continue;
      }

      // Check preferred model if specified
      if (request.preferredModel && model.model_identifier !== request.preferredModel && model.slug !== request.preferredModel && model.id !== request.preferredModel) {
        continue;
      }

      eligible.push({ model, provider, adapter });
    }

    // Apply Routing Policy sorting
    const policy = request.routingPolicy || 'balanced';

    eligible.sort((a, b) => {
      switch (policy) {
        case 'best_quality':
          return (b.model.priority ?? 0) - (a.model.priority ?? 0) || ((b.model.context_window ?? 0) - (a.model.context_window ?? 0));
        case 'cheapest':
          const costA = (a.model.input_cost ?? 0) + (a.model.output_cost ?? 0);
          const costB = (b.model.input_cost ?? 0) + (b.model.output_cost ?? 0);
          return costA - costB;
        case 'local_first':
          if (a.model.local_or_remote === 'local' && b.model.local_or_remote !== 'local') return -1;
          if (b.model.local_or_remote === 'local' && a.model.local_or_remote !== 'local') return 1;
          return (b.model.priority ?? 0) - (a.model.priority ?? 0);
        case 'cloud_first':
          if (a.model.local_or_remote === 'remote' && b.model.local_or_remote !== 'remote') return -1;
          if (b.model.local_or_remote === 'remote' && a.model.local_or_remote !== 'remote') return 1;
          return (b.model.priority ?? 0) - (a.model.priority ?? 0);
        case 'fastest':
        case 'balanced':
        default:
          return (b.model.priority ?? 0) - (a.model.priority ?? 0);
      }
    });

    return eligible;
  }
}

export const aiRouter = new AIRouter();
