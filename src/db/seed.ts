import { db } from './index';
import { providers, commandRegistry } from './schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const existingProviders = await db.select().from(providers);
  if (existingProviders.length === 0) {
    await db.insert(providers).values([
      { id: uuidv4(), name: 'Local llama.cpp', type: 'Local inference', priority: 1, capabilities: JSON.stringify(['text']), createdAt: new Date() },
      { id: uuidv4(), name: 'Groq', type: 'Cloud inference', priority: 2, capabilities: JSON.stringify(['text']), createdAt: new Date() },
      { id: uuidv4(), name: 'Hugging Face', type: 'Cloud inference', priority: 3, capabilities: JSON.stringify(['text', 'image', 'vision']), createdAt: new Date() },
      { id: uuidv4(), name: 'OpenAI-compatible Custom API', type: 'Custom provider', priority: 4, capabilities: JSON.stringify(['text']), createdAt: new Date() }
    ]);
    console.log('Seeded providers');
  }

  const existingCommands = await db.select().from(commandRegistry);
  if (existingCommands.length === 0) {
    await db.insert(commandRegistry).values([
      { id: uuidv4(), name: 'check_status', description: 'Checks health of local llama.cpp', scriptPath: 'scripts/check_health.sh', permissionLevel: 'safe' },
      { id: uuidv4(), name: 'restart_model', description: 'Restarts the local model server', scriptPath: 'scripts/restart.sh', permissionLevel: 'controlled' }
    ]);
    console.log('Seeded commands');
  }
}

seed().catch(console.error).finally(() => process.exit(0));
