import { Router } from 'express';
import { db } from '../db';
import { providers, providerCredentials, models, commandRegistry } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '../lib/encryption';

export const mellyRouter = Router();

// --- SYSTEM STATUS ---
mellyRouter.get('/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2050.1.0-RC'
  });
});

// --- PROVIDERS ---
mellyRouter.get('/providers', async (req, res) => {
  try {
    const allProviders = await db.select().from(providers).orderBy(desc(providers.priority));
    res.json({ providers: allProviders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mellyRouter.post('/providers', async (req, res) => {
  try {
    const { name, type, endpoint, capabilities, priority } = req.body;
    const id = uuidv4();
    await db.insert(providers).values({
      id,
      name,
      type,
      endpoint: endpoint || null,
      priority: priority || 0,
      capabilities: JSON.stringify(capabilities || []),
      enabled: false,
      createdAt: new Date()
    });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mellyRouter.put('/providers/:id/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    await db.update(providers).set({ enabled }).where(eq(providers.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CREDENTIALS ---
mellyRouter.get('/credentials', async (req, res) => {
  try {
    // Return masked credentials only
    const creds = await db.select({
      id: providerCredentials.id,
      providerId: providerCredentials.providerId,
    }).from(providerCredentials);
    res.json({ credentials: creds.map(c => ({ ...c, status: 'CONFIGURED', masked: '••••••••••••' })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mellyRouter.post('/credentials', async (req, res) => {
  try {
    const { providerId, rawKey } = req.body;
    if (!providerId || !rawKey) return res.status(400).json({ error: 'Missing fields' });

    // Check if provider exists
    const p = await db.select().from(providers).where(eq(providers.id, providerId));
    if (p.length === 0) return res.status(404).json({ error: 'Provider not found' });

    const { encryptedData, iv, authTag } = encrypt(rawKey);

    // Upsert credential
    const existing = await db.select().from(providerCredentials).where(eq(providerCredentials.providerId, providerId));
    if (existing.length > 0) {
      await db.update(providerCredentials).set({
        encryptedKey: encryptedData,
        iv,
        authTag
      }).where(eq(providerCredentials.providerId, providerId));
    } else {
      await db.insert(providerCredentials).values({
        id: uuidv4(),
        providerId,
        encryptedKey: encryptedData,
        iv,
        authTag
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MODELS ---
mellyRouter.get('/models', async (req, res) => {
  try {
    const allModels = await db.select().from(models);
    res.json({ models: allModels });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mellyRouter.post('/models', async (req, res) => {
  try {
    const { providerId, name, identifier } = req.body;
    const id = uuidv4();
    await db.insert(models).values({
      id,
      providerId,
      name,
      identifier,
      status: 'Available',
      isDefault: false
    });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMMANDS ---
mellyRouter.get('/commands', async (req, res) => {
  try {
    const cmds = await db.select().from(commandRegistry);
    res.json({ commands: cmds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mellyRouter.post('/commands/execute', async (req, res) => {
  try {
    const { commandId, params } = req.body;
    // Architecture principle: We do not allow arbitrary shell execution.
    // We look up the command in the registry.
    const cmdList = await db.select().from(commandRegistry).where(eq(commandRegistry.id, commandId));
    if (cmdList.length === 0) return res.status(404).json({ error: 'Command not found in registry' });
    
    // Simulate Termux execution interface rejection because Termux agent is not connected.
    // True adherence to "no fake UI" / "no arbitrary execution" means we return a realistic failure state.
    res.json({
      status: 'FAILED',
      reason: 'Termux agent not connected or unavailable.',
      exitCode: -1
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

