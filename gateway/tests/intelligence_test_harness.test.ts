import supertest from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const supabaseUrl = new URL(env.SUPABASE_URL);
const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

const validOwnerToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

const validNonOwnerToken = jwt.sign(
  { sub: '22222222-2222-2222-2222-222222222222', aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Phase 3B — Dynamic Intelligence Test Harness Validation', () => {
  describe('1. Dynamic Date & Time Execution', () => {
    it('generates date and time dynamically matching current runtime year and date', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'What is the current date and time?' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.text).toBeDefined();

      const now = new Date();
      const yearStr = now.getUTCFullYear().toString();
      expect(res.body.text).toContain(yearStr);
      expect(res.body.text).toMatch(/(Today|date|time)/i);
    });
  });

  describe('2. Dynamic Arithmetic Execution', () => {
    it('executes real arithmetic calculations at runtime', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'What is 27 × 14?' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.text).toBe('27 * 14 equals 378.');
      expect(res.body.orchestration.intent).toBe('calculation');
      expect(res.body.orchestration.complexity).toBe('low');
    });

    it('evaluates complex math expressions accurately', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Calculate 100 / 4 + 15' });

      expect(res.status).toBe(200);
      expect(res.body.text).toBe('100 / 4 + 15 equals 40.');
    });
  });

  describe('3. Conversation Router Execution', () => {
    it('executes actual Carolina conversation handler without internal diagnostic exposure', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Hi' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.text).toBe("Hello! I'm Carolina. How can I help you today?");
      expect(res.body.orchestration.intent).toBe('conversation');
      expect(res.body.orchestration.complexity).toBe('low');
      expect(res.body.provider).toBe('builtin');
      expect(res.body.model).toBe('baseline-v1');
    });
  });

  describe('4. Task Intent & Complexity Classification', () => {
    it('classifies knowledge requests correctly', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Explain quantum computing to a twelve-year-old.' });

      expect(res.status).toBe(200);
      expect(res.body.orchestration.intent).toBe('knowledge');
      expect(res.body.orchestration.complexity).toBe('medium');
    });

    it('classifies coding requests correctly', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Write a Python program that reads a CSV and calculates the average of a column.' });

      expect(res.status).toBe(200);
      expect(res.body.orchestration.intent).toBe('coding');
      expect(res.body.orchestration.complexity).toBe('medium');
    });

    it('classifies creative requests correctly', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Write a short poem about space exploration' });

      expect(res.status).toBe(200);
      expect(res.body.orchestration.intent).toBe('creative');
      expect(res.body.orchestration.complexity).toBe('medium');
    });

    it('classifies provider management and system requests correctly', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'What models are currently available?' });

      expect(res.status).toBe(200);
      expect(res.body.orchestration.intent).toBe('provider_management');
      expect(res.body.orchestration.complexity).toBe('low');
    });
  });

  describe('5. Fallback & Routing Telemetry', () => {
    it('reports fallbackCount: 0 when baseline is the first eligible candidate', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Hello Carolina', preferredProvider: 'builtin' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('builtin');
      expect(res.body.model).toBe('baseline-v1');
      expect(res.body.orchestration.fallbackCount).toBe(0);
    });

    it('reports actual fallback count when primary configured provider fails', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Explain quantum computing', preferredProvider: 'grok' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('builtin');
      expect(res.body.model).toBe('baseline-v1');
      expect(res.body.orchestration.fallbackCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Telemetry & Metadata Accuracy', () => {
    it('returns valid latencyMs, token usage, and orchestration events from live execution', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'What is Carolina?' });

      expect(res.status).toBe(200);
      expect(res.body.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.body.usage).toBeDefined();
      expect(res.body.usage.inputTokens).toBeGreaterThan(0);
      expect(res.body.usage.outputTokens).toBeGreaterThan(0);
      expect(res.body.orchestration.events).toBeInstanceOf(Array);
      expect(res.body.orchestration.events.length).toBeGreaterThan(0);
    });
  });

  describe('7. Controlled Safety & Security Enforcement', () => {
    it('returns controlled 503 error for unknown/unresolvable provider', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Test query', preferredProvider: 'unknown_provider_999' });

      expect(res.status).toBe(503);
      expect(res.body.error).toContain('No eligible AI models or providers are available');
    });

    it('returns controlled 503 error for unknown model', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'Test query', preferredModel: 'unknown_model_999' });

      expect(res.status).toBe(503);
      expect(res.body.error).toContain('No eligible AI models or providers are available');
    });

    it('returns controlled 400 error for invalid request payload', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ messages: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid request payload');
    });

    it('rejects unauthorized non-owner requests with 403', async () => {
      const res = await supertest(app)
        .post('/api/v1/melly/chat')
        .set('Authorization', `Bearer ${validNonOwnerToken}`)
        .send({ message: 'Check owner vault' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden: Owner access required');
    });
  });
});
