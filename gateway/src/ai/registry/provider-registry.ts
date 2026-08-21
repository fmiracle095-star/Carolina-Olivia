import { dbStore } from '../db/store';
import { adapterRegistry } from '../adapters/registry';
import { ProviderRecord, ModelRecord, ModelCapabilityRecord } from '../db/schema';
import { ProviderHealth } from '../types/ai';

export class ProviderRegistryService {
  async listProviders(enabledOnly: boolean = false): Promise<ProviderRecord[]> {
    return dbStore.getProviders(enabledOnly);
  }

  async getProvider(idOrSlug: string): Promise<ProviderRecord | null> {
    const byId = await dbStore.getProviderById(idOrSlug);
    if (byId) return byId;
    return dbStore.getProviderBySlug(idOrSlug);
  }

  async checkProviderHealth(idOrSlug: string): Promise<ProviderHealth> {
    const provider = await this.getProvider(idOrSlug);
    if (!provider) {
      return {
        status: 'unknown',
        message: 'Provider not found in registry',
        checkedAt: new Date().toISOString(),
      };
    }

    const adapter = adapterRegistry.get(provider.slug);
    if (!adapter) {
      return {
        status: 'unknown',
        message: `No active runtime adapter found for provider "${provider.slug}"`,
        checkedAt: new Date().toISOString(),
      };
    }

    const health = await adapter.healthCheck();
    await dbStore.updateProvider(provider.id, {
      status: health.status,
    });

    return health;
  }

  async listModels(filters?: { providerId?: string; enabledOnly?: boolean; capability?: string }): Promise<ModelRecord[]> {
    return dbStore.getModels(filters);
  }

  async getModel(idOrIdentifier: string): Promise<ModelRecord | null> {
    const byId = await dbStore.getModelById(idOrIdentifier);
    if (byId) return byId;
    return dbStore.getModelBySlugOrIdentifier(idOrIdentifier);
  }

  async getModelCapabilities(modelId: string): Promise<ModelCapabilityRecord[]> {
    return dbStore.getModelCapabilities(modelId);
  }

  async updateModel(id: string, updates: Partial<ModelRecord>): Promise<ModelRecord | null> {
    return dbStore.updateModel(id, updates);
  }

  async setModelEnabled(id: string, enabled: boolean): Promise<ModelRecord | null> {
    return dbStore.updateModel(id, { enabled });
  }

  async setProviderEnabled(id: string, enabled: boolean): Promise<ProviderRecord | null> {
    return dbStore.updateProvider(id, { enabled });
  }
}

export const providerRegistryService = new ProviderRegistryService();
