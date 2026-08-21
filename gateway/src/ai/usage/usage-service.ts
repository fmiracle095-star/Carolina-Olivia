import { dbStore } from '../db/store';
import { AIUsageRecord, AIUsageStatus } from '../db/schema';

export interface UsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  averageLatencyMs: number;
}

export interface OwnerUsageOverview extends UsageSummary {
  providerBreakdown: Record<string, { requests: number; tokens: number; cost: number }>;
  modelBreakdown: Record<string, { requests: number; tokens: number; cost: number }>;
  capabilityBreakdown: Record<string, { requests: number; tokens: number }>;
  recentLogs: AIUsageRecord[];
}

export class UsageService {
  async recordUsage(record: {
    userId: string;
    conversationId?: string | null;
    providerId?: string | null;
    modelId?: string | null;
    capability: string;
    requestId: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
    status: AIUsageStatus;
    errorCode?: string | null;
    estimatedCost?: number;
    metadata?: Record<string, any>;
  }): Promise<AIUsageRecord> {
    const input = record.inputTokens ?? 0;
    const output = record.outputTokens ?? 0;
    const total = record.totalTokens ?? (input + output);

    return dbStore.recordUsage({
      user_id: record.userId,
      conversation_id: record.conversationId || null,
      provider_id: record.providerId || null,
      model_id: record.modelId || null,
      capability: record.capability,
      request_id: record.requestId,
      input_tokens: input,
      output_tokens: output,
      total_tokens: total,
      latency_ms: record.latencyMs ?? 0,
      status: record.status,
      error_code: record.errorCode || null,
      estimated_cost: record.estimatedCost ?? 0,
      metadata: record.metadata || {},
    });
  }

  async getUserUsage(userId: string, options?: { fromDate?: Date; toDate?: Date; limit?: number }): Promise<{
    summary: UsageSummary;
    records: AIUsageRecord[];
  }> {
    const records = await dbStore.getUsageRecords({
      userId,
      fromDate: options?.fromDate,
      toDate: options?.toDate,
      limit: options?.limit ?? 50,
    });

    const summary = this.computeSummary(records);
    return { summary, records };
  }

  async getOwnerUsageSummary(options?: { fromDate?: Date; toDate?: Date; limit?: number }): Promise<OwnerUsageOverview> {
    const records = await dbStore.getUsageRecords({
      fromDate: options?.fromDate,
      toDate: options?.toDate,
      limit: options?.limit ?? 100,
    });

    const summary = this.computeSummary(records);

    const providerBreakdown: Record<string, { requests: number; tokens: number; cost: number }> = {};
    const modelBreakdown: Record<string, { requests: number; tokens: number; cost: number }> = {};
    const capabilityBreakdown: Record<string, { requests: number; tokens: number }> = {};

    for (const r of records) {
      const pKey = r.provider_id || 'unknown';
      if (!providerBreakdown[pKey]) providerBreakdown[pKey] = { requests: 0, tokens: 0, cost: 0 };
      providerBreakdown[pKey].requests += 1;
      providerBreakdown[pKey].tokens += r.total_tokens || 0;
      providerBreakdown[pKey].cost += Number(r.estimated_cost || 0);

      const mKey = r.model_id || 'unknown';
      if (!modelBreakdown[mKey]) modelBreakdown[mKey] = { requests: 0, tokens: 0, cost: 0 };
      modelBreakdown[mKey].requests += 1;
      modelBreakdown[mKey].tokens += r.total_tokens || 0;
      modelBreakdown[mKey].cost += Number(r.estimated_cost || 0);

      const cKey = r.capability || 'unknown';
      if (!capabilityBreakdown[cKey]) capabilityBreakdown[cKey] = { requests: 0, tokens: 0 };
      capabilityBreakdown[cKey].requests += 1;
      capabilityBreakdown[cKey].tokens += r.total_tokens || 0;
    }

    return {
      ...summary,
      providerBreakdown,
      modelBreakdown,
      capabilityBreakdown,
      recentLogs: records,
    };
  }

  private computeSummary(records: AIUsageRecord[]): UsageSummary {
    let totalRequests = records.length;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let estimatedCost = 0;
    let totalLatency = 0;

    for (const r of records) {
      if (r.status === 'success') {
        successfulRequests += 1;
      } else {
        failedRequests += 1;
      }

      totalTokens += r.total_tokens || 0;
      inputTokens += r.input_tokens || 0;
      outputTokens += r.output_tokens || 0;
      estimatedCost += Number(r.estimated_cost || 0);
      totalLatency += r.latency_ms || 0;
    }

    const averageLatencyMs = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokens,
      inputTokens,
      outputTokens,
      estimatedCost: Number(estimatedCost.toFixed(6)),
      averageLatencyMs,
    };
  }
}

export const usageService = new UsageService();
