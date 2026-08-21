import { Router, Request, Response } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';
import { env } from '../config/env';
import { providerRegistryService } from '../ai/registry/provider-registry';

export const providersRouter = Router();

// GET /api/v1/providers - Lists providers (no secrets exposed)
providersRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);

    const providers = await providerRegistryService.listProviders(!isOwner);
    
    // Sanitize output
    const safeProviders = providers.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      enabled: p.enabled,
      status: p.status,
      capabilities: p.capabilities,
      base_url: isOwner ? p.base_url : undefined,
      metadata: p.metadata,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return res.json({
      providers: safeProviders,
      count: safeProviders.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list providers' });
  }
});

// GET /api/v1/providers/:id - Get provider details
providersRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);
    const providerId = String(req.params.id);

    const provider = await providerRegistryService.getProvider(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (!provider.enabled && !isOwner) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    return res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        type: provider.type,
        enabled: provider.enabled,
        status: provider.status,
        capabilities: provider.capabilities,
        base_url: isOwner ? provider.base_url : undefined,
        metadata: provider.metadata,
        created_at: provider.created_at,
        updated_at: provider.updated_at,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get provider' });
  }
});

// POST /api/v1/providers/:id/health - Check provider health (Owner only)
providersRouter.post('/:id/health', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const providerId = String(req.params.id);
    const health = await providerRegistryService.checkProviderHealth(providerId);
    return res.json({
      providerId,
      health,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to check provider health' });
  }
});

// POST /api/v1/providers/:id/enable - Enable provider (Owner only)
providersRouter.post('/:id/enable', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const providerId = String(req.params.id);
    const provider = await providerRegistryService.getProvider(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const updated = await providerRegistryService.setProviderEnabled(provider.id, true);
    return res.json({ status: 'success', provider: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to enable provider' });
  }
});

// POST /api/v1/providers/:id/disable - Disable provider (Owner only)
providersRouter.post('/:id/disable', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const providerId = String(req.params.id);
    const provider = await providerRegistryService.getProvider(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const updated = await providerRegistryService.setProviderEnabled(provider.id, false);
    return res.json({ status: 'success', provider: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to disable provider' });
  }
});
