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
import { taskAnalyzer } from '../orchestration/task-analyzer';
import { executionPlanner } from '../orchestration/planner';
import { orchestrationEvents } from '../orchestration/events';
import { ExecutionPlan } from '../orchestration/types';

export interface RouterUserContext {
  userId: string;
  isOwner?: boolean;
}

export class AIRouter {
  async route(request: NormalizedAIRequest, context: RouterUserContext): Promise<NormalizedAIResponse> {
    const capability = request.capability || 'chat.generate';
    const requestId = request.requestId || crypto.randomUUID();
    const startTime = performance.now();

    // 1. Orchestration Analysis & Planning
    orchestrationEvents.emit(requestId, 'REQUEST_RECEIVED', {});
    orchestrationEvents.emit(requestId, 'ANALYZING', {});
    const analysis = taskAnalyzer.analyze(request);

    orchestrationEvents.emit(requestId, 'PLANNING', { 
      intent: analysis.intent, 
      complexity: analysis.complexity 
    });
    const plan = executionPlanner.createPlan(analysis, request);

    orchestrationEvents.emit(requestId, 'SELECTING_PROVIDER', { 
      intent: plan.intent, 
      complexity: plan.complexity 
    });

    // 2. Quota Check
    const quotaResult = await quotaManager.checkQuota(context.userId, context.isOwner);
    if (!quotaResult.allowed) {
      orchestrationEvents.emit(requestId, 'FAILED', { message: quotaResult.reason || 'Quota limit exceeded' });
      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        capability,
        requestId,
        status: 'rejected',
        errorCode: 'QUOTA_EXCEEDED',
        metadata: { reason: quotaResult.reason, limitType: quotaResult.limitType, intent: analysis.intent },
      });

      const err = new Error(quotaResult.reason || 'AI quota limit exceeded');
      (err as any).statusCode = 429;
      (err as any).errorCode = 'QUOTA_EXCEEDED';
      throw err;
    }

    // 3. Resolve Eligible Models and Providers using Execution Plan
    const candidates = await this.resolveCandidates(request, capability, plan);

    if (candidates.length === 0) {
      orchestrationEvents.emit(requestId, 'FAILED', { message: 'No eligible AI models or providers available' });
      await usageService.recordUsage({
        userId: context.userId,
        conversationId: request.conversationId,
        capability,
        requestId,
        latencyMs: Math.round(performance.now() - startTime),
        status: 'failed',
        errorCode: 'NO_AVAILABLE_MODELS',
        metadata: { reason: 'No eligible AI models or providers found', intent: analysis.intent },
      });

      const err = new Error('No eligible AI models or providers are available for this request');
      (err as any).statusCode = 503;
      (err as any).errorCode = 'NO_AVAILABLE_MODELS';
      throw err;
    }

    // 4. Attempt Execution with Controlled Fallback
    let lastError: any = null;
    let fallbackCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const { model, provider, adapter } = candidate;
      const attemptStart = performance.now();

      if (i > 0) {
        fallbackCount++;
        orchestrationEvents.emit(requestId, 'FALLBACK', {
          provider: provider.slug,
          model: model.model_identifier,
          message: `Falling back to provider "${provider.slug}" (${model.model_identifier})`,
        });
      }

      orchestrationEvents.emit(requestId, 'EXECUTING', {
        provider: provider.slug,
        model: model.model_identifier,
      });

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
          metadata: { 
            policy: plan.preferredPolicy, 
            modelIdentifier: model.model_identifier,
            intent: analysis.intent,
            complexity: analysis.complexity,
            fallbackCount,
          },
        });

        orchestrationEvents.emit(requestId, 'COMPLETED', {
          provider: provider.slug,
          model: model.model_identifier,
          latencyMs: attemptLatency,
        });

        return {
          ...response,
          requestId,
          provider: provider.slug,
          model: model.model_identifier,
          orchestration: {
            intent: analysis.intent,
            complexity: analysis.complexity,
            requiredCapabilities: analysis.requiredCapabilities,
            executionPlan: plan,
            fallbackCount,
            events: orchestrationEvents.getEventsForRequest(requestId),
          },
        };
      } catch (err: any) {
        lastError = err;
        const attemptLatency = Math.round(performance.now() - attemptStart);
        const statusCode = (err as any)?.statusCode || 500;
        const errorCode = (err as any)?.errorCode || 'EXECUTION_FAILED';

        // Record failed attempt in usage telemetry
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
          metadata: { 
            errorMessage: err?.message, 
            provider: provider.slug, 
            model: model.model_identifier,
            intent: analysis.intent,
            complexity: analysis.complexity,
          },
        });
      }
    }

    orchestrationEvents.emit(requestId, 'FAILED', { message: 'All candidate model providers failed' });

    // All candidates failed
    const finalErr = new Error('Carolina is temporarily unable to process this request. Please try again shortly.');
    (finalErr as any).statusCode = 503;
    (finalErr as any).errorCode = 'PROVIDER_UNAVAILABLE';
    throw finalErr;
  }

  async *streamRoute(request: NormalizedAIRequest, context: RouterUserContext): AsyncIterable<NormalizedAIChunk> {
    const capability = request.capability || 'chat.stream';
    const requestId = request.requestId || crypto.randomUUID();
    const startTime = performance.now();

    orchestrationEvents.emit(requestId, 'REQUEST_RECEIVED', {});
    orchestrationEvents.emit(requestId, 'ANALYZING', {});
    const analysis = taskAnalyzer.analyze(request);

    orchestrationEvents.emit(requestId, 'PLANNING', { intent: analysis.intent, complexity: analysis.complexity });
    const plan = executionPlanner.createPlan(analysis, request);

    orchestrationEvents.emit(requestId, 'SELECTING_PROVIDER', { intent: plan.intent, complexity: plan.complexity });

    // 1. Quota Check
    const quotaResult = await quotaManager.checkQuota(context.userId, context.isOwner);
    if (!quotaResult.allowed) {
      orchestrationEvents.emit(requestId, 'FAILED', { message: quotaResult.reason || 'Quota limit exceeded' });
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
    const candidates = await this.resolveCandidates(request, capability, plan);
    if (candidates.length === 0) {
      orchestrationEvents.emit(requestId, 'FAILED', { message: 'No eligible AI models available for streaming' });
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

    orchestrationEvents.emit(requestId, 'EXECUTING', { provider: provider.slug, model: model.model_identifier });

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
      const estInputTokens = Math.round(request.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) / 4);
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
        metadata: { streaming: true, modelIdentifier: model.model_identifier, intent: analysis.intent },
      });

      orchestrationEvents.emit(requestId, 'COMPLETED', { provider: provider.slug, model: model.model_identifier, latencyMs });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      orchestrationEvents.emit(requestId, 'FAILED', { provider: provider.slug, model: model.model_identifier, message: err?.message });
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

  private async resolveCandidates(
    request: NormalizedAIRequest, 
    capability: string,
    plan?: ExecutionPlan
  ): Promise<Array<{
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
      if (request.preferredProvider || plan?.preferredProvider) {
        const pref = (request.preferredProvider || plan?.preferredProvider || '').toLowerCase();
        const matchesSlug = provider.slug === pref || 
          ((pref === 'baseline' || pref === 'builtin') && (provider.slug === 'builtin' || provider.slug === 'baseline'));
        const matchesId = provider.id === pref;
        if (!matchesSlug && !matchesId) {
          continue;
        }
      }

      // Check preferred model if specified
      if (request.preferredModel || plan?.preferredModel) {
        const pref = (request.preferredModel || plan?.preferredModel || '').toLowerCase();
        const matchesIdent = model.model_identifier.toLowerCase() === pref || model.slug.toLowerCase() === pref;
        const matchesAlias = (pref === 'baseline' || pref === 'builtin' || pref === 'baseline-v1') && 
          (model.model_identifier === 'baseline-v1' || model.slug === 'baseline-v1');
        const matchesId = model.id === pref;
        if (!matchesIdent && !matchesAlias && !matchesId) {
          continue;
        }
      }

      eligible.push({ model, provider, adapter });
    }

    // Apply Routing Policy & Plan-aware sorting
    const policy = plan?.preferredPolicy || request.routingPolicy || 'balanced';

    eligible.sort((a, b) => {
      // If task requires general AI capability (e.g. coding, knowledge, reasoning), prefer non-baseline models over builtin baseline
      if (plan?.requiresGeneralAI) {
        const aIsBuiltin = a.provider.slug === 'builtin';
        const bIsBuiltin = b.provider.slug === 'builtin';
        if (!aIsBuiltin && bIsBuiltin) return -1;
        if (aIsBuiltin && !bIsBuiltin) return 1;
      }

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
