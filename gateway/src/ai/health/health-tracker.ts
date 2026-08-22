export type ProviderHealthState = 
  | 'HEALTHY'
  | 'DEGRADED'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'UNCONFIGURED'
  | 'DISABLED';

export interface ProviderHealthRecord {
  providerSlug: string;
  state: ProviderHealthState;
  consecutiveFailures: number;
  lastFailureTime?: number;
  rateLimitResetTime?: number;
  latencyMs?: number;
  lastMessage?: string;
  updatedAt: string;
}

export class ProviderHealthTracker {
  private records: Map<string, ProviderHealthRecord> = new Map();

  constructor() {
    this.initDefaultRecords();
  }

  private initDefaultRecords() {
    this.records.set('builtin', {
      providerSlug: 'builtin',
      state: 'HEALTHY',
      consecutiveFailures: 0,
      updatedAt: new Date().toISOString(),
    });

    this.records.set('grok', {
      providerSlug: 'grok',
      state: 'HEALTHY',
      consecutiveFailures: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  public getHealth(providerSlug: string): ProviderHealthRecord {
    const existing = this.records.get(providerSlug);
    if (!existing) {
      const initial: ProviderHealthRecord = {
        providerSlug,
        state: 'HEALTHY',
        consecutiveFailures: 0,
        updatedAt: new Date().toISOString(),
      };
      this.records.set(providerSlug, initial);
      return initial;
    }

    // Auto-recover RATE_LIMITED if reset time passed (e.g. 60s)
    if (existing.state === 'RATE_LIMITED' && existing.rateLimitResetTime && Date.now() > existing.rateLimitResetTime) {
      existing.state = 'HEALTHY';
      existing.consecutiveFailures = 0;
      existing.updatedAt = new Date().toISOString();
    }

    return existing;
  }

  public recordSuccess(providerSlug: string, latencyMs?: number): void {
    const rec = this.getHealth(providerSlug);
    rec.state = 'HEALTHY';
    rec.consecutiveFailures = 0;
    rec.latencyMs = latencyMs;
    rec.lastMessage = undefined;
    rec.updatedAt = new Date().toISOString();
  }

  public recordFailure(providerSlug: string, statusCode?: number, errorCode?: string, message?: string): void {
    const rec = this.getHealth(providerSlug);
    rec.consecutiveFailures += 1;
    rec.lastFailureTime = Date.now();
    rec.lastMessage = message;
    rec.updatedAt = new Date().toISOString();

    if (errorCode === 'PROVIDER_NOT_CONFIGURED') {
      rec.state = 'UNCONFIGURED';
    } else if (statusCode === 429 || errorCode === 'RATE_LIMITED') {
      rec.state = 'RATE_LIMITED';
      rec.rateLimitResetTime = Date.now() + 60000; // 60s backoff
    } else if (statusCode === 401 || statusCode === 403) {
      rec.state = 'UNCONFIGURED';
    } else if (rec.consecutiveFailures >= 3) {
      rec.state = 'UNAVAILABLE';
    } else {
      rec.state = 'DEGRADED';
    }
  }

  public setHealthState(providerSlug: string, state: ProviderHealthState, message?: string): void {
    const rec = this.getHealth(providerSlug);
    rec.state = state;
    if (state === 'HEALTHY') rec.consecutiveFailures = 0;
    if (message) rec.lastMessage = message;
    rec.updatedAt = new Date().toISOString();
  }

  public isEligibleForRouting(providerSlug: string): boolean {
    const health = this.getHealth(providerSlug);
    return health.state !== 'DISABLED' && health.state !== 'UNCONFIGURED';
  }

  public getAllHealthRecords(): ProviderHealthRecord[] {
    return Array.from(this.records.values());
  }
}

export const providerHealthTracker = new ProviderHealthTracker();
