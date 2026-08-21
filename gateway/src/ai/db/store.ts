import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { env } from '../../config/env';
import { 
  ProviderRecord, 
  ModelRecord, 
  ModelCapabilityRecord, 
  AIUsageRecord, 
  RoutingPolicyRecord, 
  UserAILimitsRecord 
} from './schema';

export class DatabaseStore {
  private supabase: SupabaseClient | null = null;
  private providers: Map<string, ProviderRecord> = new Map();
  private models: Map<string, ModelRecord> = new Map();
  private capabilities: Map<string, ModelCapabilityRecord> = new Map();
  private usage: AIUsageRecord[] = [];
  private routingPolicies: Map<string, RoutingPolicyRecord> = new Map();
  private userLimits: Map<string, UserAILimitsRecord> = new Map();

  constructor() {
    this.initSupabase();
    this.seedDefaultData();
  }

  private initSupabase() {
    try {
      if (env.SUPABASE_URL && !env.SUPABASE_URL.includes('placeholder') && env.SUPABASE_ANON_KEY) {
        this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          auth: { persistSession: false }
        });
      }
    } catch {
      this.supabase = null;
    }
  }

  private seedDefaultData() {
    const grokProviderId = '10000000-0000-0000-0000-000000000001';
    const grok2ModelId = '20000000-0000-0000-0000-000000000001';
    const grokBetaModelId = '20000000-0000-0000-0000-000000000002';

    const grokProvider: ProviderRecord = {
      id: grokProviderId,
      name: 'xAI Grok',
      slug: 'grok',
      type: 'remote',
      base_url: 'https://api.x.ai/v1',
      enabled: true,
      status: 'healthy',
      auth_type: 'bearer',
      capabilities: ['chat.generate', 'chat.stream'],
      metadata: { vendor: 'xAI', description: 'xAI Grok Cloud Provider' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.providers.set(grokProvider.id, grokProvider);

    const grok2Model: ModelRecord = {
      id: grok2ModelId,
      provider_id: grokProviderId,
      name: 'grok-2-latest',
      slug: 'grok-2-latest',
      model_identifier: 'grok-2-latest',
      display_name: 'Grok 2 Latest',
      description: 'Advanced reasoning and conversational model from xAI',
      context_window: 131072,
      local_or_remote: 'remote',
      enabled: true,
      priority: 10,
      status: 'healthy',
      input_cost: 0.000002,
      output_cost: 0.000010,
      metadata: { recommended: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.models.set(grok2Model.id, grok2Model);

    const grokBetaModel: ModelRecord = {
      id: grokBetaModelId,
      provider_id: grokProviderId,
      name: 'grok-beta',
      slug: 'grok-beta',
      model_identifier: 'grok-beta',
      display_name: 'Grok Beta',
      description: 'High-speed generative AI model from xAI',
      context_window: 131072,
      local_or_remote: 'remote',
      enabled: true,
      priority: 5,
      status: 'healthy',
      input_cost: 0.000005,
      output_cost: 0.000015,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.models.set(grokBetaModel.id, grokBetaModel);

    const caps: ModelCapabilityRecord[] = [
      {
        id: crypto.randomUUID(),
        model_id: grok2ModelId,
        capability: 'chat.generate',
        enabled: true,
        metadata: {},
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        model_id: grok2ModelId,
        capability: 'chat.stream',
        enabled: true,
        metadata: {},
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        model_id: grokBetaModelId,
        capability: 'chat.generate',
        enabled: true,
        metadata: {},
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        model_id: grokBetaModelId,
        capability: 'chat.stream',
        enabled: true,
        metadata: {},
        created_at: new Date().toISOString(),
      },
    ];
    caps.forEach(c => this.capabilities.set(`${c.model_id}:${c.capability}`, c));

    const policies: RoutingPolicyRecord[] = [
      {
        id: '30000000-0000-0000-0000-000000000001',
        name: 'Balanced Routing',
        slug: 'balanced',
        strategy: 'balanced',
        enabled: true,
        configuration: { weight_priority: 0.5, weight_latency: 0.5 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        name: 'Best Quality Routing',
        slug: 'best_quality',
        strategy: 'best_quality',
        enabled: true,
        configuration: { prefer_highest_priority: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        name: 'Fastest Response',
        slug: 'fastest',
        strategy: 'fastest',
        enabled: true,
        configuration: { prefer_lowest_latency: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        name: 'Cost Optimized',
        slug: 'cheapest',
        strategy: 'cheapest',
        enabled: true,
        configuration: { prefer_lowest_cost: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        name: 'Local Priority',
        slug: 'local_first',
        strategy: 'local_first',
        enabled: true,
        configuration: { prefer_local: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '30000000-0000-0000-0000-000000000006',
        name: 'Cloud First',
        slug: 'cloud_first',
        strategy: 'cloud_first',
        enabled: true,
        configuration: { prefer_cloud: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    policies.forEach(p => this.routingPolicies.set(p.slug, p));
  }

  // --- Provider operations ---
  async getProviders(enabledOnly: boolean = false): Promise<ProviderRecord[]> {
    if (this.supabase) {
      try {
        let q = this.supabase.from('providers').select('*');
        if (enabledOnly) q = q.eq('enabled', true);
        const { data, error } = await q;
        if (!error && data && data.length > 0) return data as ProviderRecord[];
      } catch {
        // Fallback to memory
      }
    }
    const list = Array.from(this.providers.values());
    return enabledOnly ? list.filter(p => p.enabled) : list;
  }

  async getProviderById(id: string): Promise<ProviderRecord | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('providers').select('*').eq('id', id).single();
        if (!error && data) return data as ProviderRecord;
      } catch {
        // Fallback to memory
      }
    }
    return this.providers.get(id) || null;
  }

  async getProviderBySlug(slug: string): Promise<ProviderRecord | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('providers').select('*').eq('slug', slug).single();
        if (!error && data) return data as ProviderRecord;
      } catch {
        // Fallback to memory
      }
    }
    for (const p of this.providers.values()) {
      if (p.slug === slug) return p;
    }
    return null;
  }

  async updateProvider(id: string, updates: Partial<ProviderRecord>): Promise<ProviderRecord | null> {
    const existing = await this.getProviderById(id);
    if (!existing) return null;

    const updated: ProviderRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.providers.set(id, updated);

    if (this.supabase) {
      try {
        await this.supabase.from('providers').update(updates).eq('id', id);
      } catch {
        // Non-blocking
      }
    }
    return updated;
  }

  // --- Model operations ---
  async getModels(filters?: { providerId?: string; enabledOnly?: boolean; capability?: string }): Promise<ModelRecord[]> {
    if (this.supabase) {
      try {
        let q = this.supabase.from('models').select('*');
        if (filters?.providerId) q = q.eq('provider_id', filters.providerId);
        if (filters?.enabledOnly) q = q.eq('enabled', true);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          let models = data as ModelRecord[];
          if (filters?.capability) {
            const capMatches = await this.getModelsForCapability(filters.capability);
            const capModelIds = new Set(capMatches.map(m => m.id));
            models = models.filter(m => capModelIds.has(m.id));
          }
          return models;
        }
      } catch {
        // Fallback to memory
      }
    }

    let list = Array.from(this.models.values());
    if (filters?.providerId) {
      list = list.filter(m => m.provider_id === filters.providerId);
    }
    if (filters?.enabledOnly) {
      list = list.filter(m => m.enabled);
    }
    if (filters?.capability) {
      const cap = filters.capability;
      list = list.filter(m => {
        const key = `${m.id}:${cap}`;
        const record = this.capabilities.get(key);
        return record ? record.enabled : true;
      });
    }
    return list;
  }

  async getModelById(id: string): Promise<ModelRecord | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('models').select('*').eq('id', id).single();
        if (!error && data) return data as ModelRecord;
      } catch {
        // Fallback to memory
      }
    }
    return this.models.get(id) || null;
  }

  async getModelBySlugOrIdentifier(ident: string): Promise<ModelRecord | null> {
    for (const m of this.models.values()) {
      if (m.model_identifier === ident || m.slug === ident || m.id === ident) {
        return m;
      }
    }
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('models')
          .select('*')
          .or(`model_identifier.eq.${ident},slug.eq.${ident},id.eq.${ident}`)
          .limit(1);
        if (!error && data && data.length > 0) return data[0] as ModelRecord;
      } catch {
        // Fallback to memory
      }
    }
    return null;
  }

  async updateModel(id: string, updates: Partial<ModelRecord>): Promise<ModelRecord | null> {
    const existing = await this.getModelById(id);
    if (!existing) return null;

    const updated: ModelRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.models.set(id, updated);

    if (this.supabase) {
      try {
        await this.supabase.from('models').update(updates).eq('id', id);
      } catch {
        // Non-blocking
      }
    }
    return updated;
  }

  async getModelCapabilities(modelId: string): Promise<ModelCapabilityRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('model_capabilities').select('*').eq('model_id', modelId);
        if (!error && data && data.length > 0) return data as ModelCapabilityRecord[];
      } catch {
        // Fallback
      }
    }
    return Array.from(this.capabilities.values()).filter(c => c.model_id === modelId && c.enabled);
  }

  async getModelsForCapability(capability: string): Promise<ModelRecord[]> {
    return Array.from(this.models.values()).filter(m => {
      const rec = this.capabilities.get(`${m.id}:${capability}`);
      return rec ? rec.enabled : false;
    });
  }

  // --- Routing Policies ---
  async getRoutingPolicies(): Promise<RoutingPolicyRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('routing_policies').select('*');
        if (!error && data && data.length > 0) return data as RoutingPolicyRecord[];
      } catch {
        // Fallback
      }
    }
    return Array.from(this.routingPolicies.values());
  }

  async getRoutingPolicyBySlug(slug: string): Promise<RoutingPolicyRecord | null> {
    return this.routingPolicies.get(slug) || null;
  }

  // --- User Limits / Quotas ---
  async getUserLimits(userId: string): Promise<UserAILimitsRecord | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('user_ai_limits').select('*').eq('user_id', userId).single();
        if (!error && data) return data as UserAILimitsRecord;
      } catch {
        // Fallback
      }
    }
    return this.userLimits.get(userId) || null;
  }

  async setUserLimits(userId: string, limits: Partial<UserAILimitsRecord>): Promise<UserAILimitsRecord> {
    const existing = await this.getUserLimits(userId);
    const updated: UserAILimitsRecord = {
      id: existing?.id || crypto.randomUUID(),
      user_id: userId,
      daily_requests: limits.daily_requests !== undefined ? limits.daily_requests : (existing?.daily_requests ?? null),
      daily_tokens: limits.daily_tokens !== undefined ? limits.daily_tokens : (existing?.daily_tokens ?? null),
      monthly_tokens: limits.monthly_tokens !== undefined ? limits.monthly_tokens : (existing?.monthly_tokens ?? null),
      enabled: limits.enabled !== undefined ? limits.enabled : (existing?.enabled ?? true),
      configuration: limits.configuration || existing?.configuration || {},
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.userLimits.set(userId, updated);

    if (this.supabase) {
      try {
        await this.supabase.from('user_ai_limits').upsert(updated);
      } catch {
        // Non-blocking
      }
    }
    return updated;
  }

  // --- AI Usage Tracking ---
  async recordUsage(record: Omit<AIUsageRecord, 'id' | 'created_at'>): Promise<AIUsageRecord> {
    const fullRecord: AIUsageRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.usage.push(fullRecord);

    if (this.supabase) {
      try {
        await this.supabase.from('ai_usage').insert(fullRecord);
      } catch {
        // Non-blocking
      }
    }
    return fullRecord;
  }

  async getUsageRecords(filters?: {
    userId?: string;
    providerId?: string;
    modelId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<AIUsageRecord[]> {
    if (this.supabase) {
      try {
        let q = this.supabase.from('ai_usage').select('*').order('created_at', { ascending: false });
        if (filters?.userId) q = q.eq('user_id', filters.userId);
        if (filters?.providerId) q = q.eq('provider_id', filters.providerId);
        if (filters?.modelId) q = q.eq('model_id', filters.modelId);
        if (filters?.fromDate) q = q.gte('created_at', filters.fromDate.toISOString());
        if (filters?.toDate) q = q.lte('created_at', filters.toDate.toISOString());
        if (filters?.limit) q = q.limit(filters.limit);
        const { data, error } = await q;
        if (!error && data) return data as AIUsageRecord[];
      } catch {
        // Fallback to memory
      }
    }

    let records = [...this.usage];
    if (filters?.userId) {
      records = records.filter(r => r.user_id === filters.userId);
    }
    if (filters?.providerId) {
      records = records.filter(r => r.provider_id === filters.providerId);
    }
    if (filters?.modelId) {
      records = records.filter(r => r.model_id === filters.modelId);
    }
    if (filters?.fromDate) {
      const fromTime = filters.fromDate.getTime();
      records = records.filter(r => new Date(r.created_at).getTime() >= fromTime);
    }
    if (filters?.toDate) {
      const toTime = filters.toDate.getTime();
      records = records.filter(r => new Date(r.created_at).getTime() <= toTime);
    }

    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (filters?.limit) {
      records = records.slice(0, filters.limit);
    }
    return records;
  }

  // Clear usage for testing
  clearUsage(): void {
    this.usage = [];
  }
}

export const dbStore = new DatabaseStore();
