import { ProviderAdapter } from './base';
import { GrokProviderAdapter } from './grok';
import { BaselineProviderAdapter } from './baseline';

export class AdapterRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    this.register(new BaselineProviderAdapter());
    this.register(new GrokProviderAdapter());
  }

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.slug, adapter);
  }

  get(slug: string): ProviderAdapter | undefined {
    if (slug === 'baseline') {
      return this.adapters.get('builtin') || this.adapters.get('baseline');
    }
    return this.adapters.get(slug);
  }

  has(slug: string): boolean {
    if (slug === 'baseline') {
      return this.adapters.has('builtin') || this.adapters.has('baseline');
    }
    return this.adapters.has(slug);
  }

  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const adapterRegistry = new AdapterRegistry();
