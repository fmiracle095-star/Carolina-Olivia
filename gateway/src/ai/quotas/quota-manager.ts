import { dbStore } from '../db/store';

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  limitType?: 'daily_requests' | 'daily_tokens' | 'monthly_tokens';
  current?: number;
  max?: number;
}

export class QuotaManager {
  // Default limits for regular users if no custom limit record is set
  private readonly defaultDailyRequests = 100;
  private readonly defaultDailyTokens = 200000;
  private readonly defaultMonthlyTokens = 5000000;

  async checkQuota(userId: string, isOwner: boolean = false): Promise<QuotaCheckResult> {
    // Owners bypass quota limits by default
    if (isOwner) {
      return { allowed: true };
    }

    const limits = await dbStore.getUserLimits(userId);
    if (limits && !limits.enabled) {
      return {
        allowed: false,
        reason: 'AI access has been disabled for this user account',
      };
    }

    const maxDailyRequests = limits?.daily_requests ?? this.defaultDailyRequests;
    const maxDailyTokens = limits?.daily_tokens ?? this.defaultDailyTokens;
    const maxMonthlyTokens = limits?.monthly_tokens ?? this.defaultMonthlyTokens;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dayRecords = await dbStore.getUsageRecords({
      userId,
      fromDate: startOfDay,
    });

    const monthRecords = await dbStore.getUsageRecords({
      userId,
      fromDate: startOfMonth,
    });

    const dayRequests = dayRecords.length;
    let dayTokens = 0;
    for (const r of dayRecords) {
      dayTokens += r.total_tokens || 0;
    }

    let monthTokens = 0;
    for (const r of monthRecords) {
      monthTokens += r.total_tokens || 0;
    }

    if (typeof maxDailyRequests === 'number' && maxDailyRequests >= 0 && dayRequests >= maxDailyRequests) {
      return {
        allowed: false,
        reason: `Daily request quota exceeded (${dayRequests}/${maxDailyRequests})`,
        limitType: 'daily_requests',
        current: dayRequests,
        max: maxDailyRequests,
      };
    }

    if (typeof maxDailyTokens === 'number' && maxDailyTokens >= 0 && dayTokens >= maxDailyTokens) {
      return {
        allowed: false,
        reason: `Daily token quota exceeded (${dayTokens}/${maxDailyTokens})`,
        limitType: 'daily_tokens',
        current: dayTokens,
        max: maxDailyTokens,
      };
    }

    if (typeof maxMonthlyTokens === 'number' && maxMonthlyTokens >= 0 && monthTokens >= maxMonthlyTokens) {
      return {
        allowed: false,
        reason: `Monthly token quota exceeded (${monthTokens}/${maxMonthlyTokens})`,
        limitType: 'monthly_tokens',
        current: monthTokens,
        max: maxMonthlyTokens,
      };
    }

    return { allowed: true };
  }
}

export const quotaManager = new QuotaManager();
