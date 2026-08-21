import { ProviderAdapter } from './base';
import { GrokProviderAdapter } from './grok';

export class AdapterRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    this.register(new GrokProviderAdapter());
  }

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.slug, adapter);
  }

  get(slug: string): ProviderAdapter | undefined {
    return this.adapters.get(slug);
  }

  has(slug: string): boolean {
    return this.adapters.has(slug);
  }

  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const adapterRegistry = new AdapterRegistry();
