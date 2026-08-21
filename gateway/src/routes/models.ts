import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireOwner } from '../middleware/auth';
import { env } from '../config/env';
import { providerRegistryService } from '../ai/registry/provider-registry';

export const modelsRouter = Router();

const updateModelSchema = z.object({
  display_name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  status: z.enum(['healthy', 'degraded', 'offline', 'unknown']).optional(),
  input_cost: z.number().min(0).optional(),
  output_cost: z.number().min(0).optional(),
  context_window: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
});

// GET /api/v1/models - List models
modelsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);

    const providerId = req.query.providerId as string | undefined;
    const capability = req.query.capability as string | undefined;

    const models = await providerRegistryService.listModels({
      providerId,
      capability,
      enabledOnly: !isOwner,
    });

    const enriched = await Promise.all(
      models.map(async m => {
        const capabilities = await providerRegistryService.getModelCapabilities(m.id);
        return {
          id: m.id,
          provider_id: m.provider_id,
          name: m.name,
          slug: m.slug,
          model_identifier: m.model_identifier,
          display_name: m.display_name,
          description: m.description,
          context_window: m.context_window,
          local_or_remote: m.local_or_remote,
          enabled: m.enabled,
          priority: m.priority,
          status: m.status,
          capabilities: capabilities.map(c => c.capability),
          input_cost: isOwner ? m.input_cost : undefined,
          output_cost: isOwner ? m.output_cost : undefined,
          metadata: m.metadata,
          created_at: m.created_at,
          updated_at: m.updated_at,
        };
      })
    );

    return res.json({
      models: enriched,
      count: enriched.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list models' });
  }
});

// GET /api/v1/models/:id - Get model details
modelsRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);
    const modelId = String(req.params.id);

    const model = await providerRegistryService.getModel(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    if (!model.enabled && !isOwner) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const capabilities = await providerRegistryService.getModelCapabilities(model.id);

    return res.json({
      model: {
        id: model.id,
        provider_id: model.provider_id,
        name: model.name,
        slug: model.slug,
        model_identifier: model.model_identifier,
        display_name: model.display_name,
        description: model.description,
        context_window: model.context_window,
        local_or_remote: model.local_or_remote,
        enabled: model.enabled,
        priority: model.priority,
        status: model.status,
        capabilities: capabilities.map(c => c.capability),
        input_cost: isOwner ? model.input_cost : undefined,
        output_cost: isOwner ? model.output_cost : undefined,
        metadata: model.metadata,
        created_at: model.created_at,
        updated_at: model.updated_at,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get model' });
  }
});

// POST /api/v1/models/:id/enable - Enable model (Owner only)
modelsRouter.post('/:id/enable', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const modelId = String(req.params.id);
    const model = await providerRegistryService.getModel(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    const updated = await providerRegistryService.setModelEnabled(model.id, true);
    return res.json({ status: 'success', model: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to enable model' });
  }
});

// POST /api/v1/models/:id/disable - Disable model (Owner only)
modelsRouter.post('/:id/disable', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const modelId = String(req.params.id);
    const model = await providerRegistryService.getModel(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    const updated = await providerRegistryService.setModelEnabled(model.id, false);
    return res.json({ status: 'success', model: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to disable model' });
  }
});

// PATCH /api/v1/models/:id - Update model configuration (Owner only)
modelsRouter.patch('/:id', authenticate, requireOwner, async (req: Request, res: Response) => {
  try {
    const parsed = updateModelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid update payload', details: parsed.error.issues });
    }

    const modelId = String(req.params.id);
    const model = await providerRegistryService.getModel(modelId);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const updated = await providerRegistryService.updateModel(model.id, parsed.data);
    return res.json({ status: 'success', model: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update model' });
  }
});
