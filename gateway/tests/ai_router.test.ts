import supertest from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { dbStore } from '../src/ai/db/store';

const supabaseUrl = new URL(env.SUPABASE_URL);
const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

const ownerToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

const nonOwnerUserId = '99999999-9999-9999-9999-999999999999';
const nonOwnerToken = jwt.sign(
  { sub: nonOwnerUserId, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Phase 2 AI Infrastructure & Router', () => {
  beforeEach(() => {
    dbStore.clearUsage();
  });

  describe('Provider Registry', () => {
    it('returns providers list for authenticated user without exposing secrets', async () => {
      const res = await supertest(app)
        .get('/api/v1/providers')
        .set('Authorization', `Bearer ${nonOwnerToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.providers).toBeDefined();
      expect(res.body.providers.length).toBeGreaterThan(0);
      
      const grok = res.body.providers.find((p: any) => p.slug === 'grok');
      expect(grok).toBeDefined();
      expect(grok.name).toBe('xAI Grok');
      expect(grok.capabilities).toContain('chat.generate');
      expect(grok.api_key).toBeUndefined();
      expect(grok.secret).toBeUndefined();

      const builtin = res.body.providers.find((p: any) => p.slug === 'builtin');
      expect(builtin).toBeDefined();
      expect(builtin.name).toBe('Built-in Baseline');
      expect(builtin.status).toBe('healthy');
      expect(builtin.capabilities).toContain('chat.generate');
    });

    it('returns provider details by slug or id including builtin', async () => {
      const res = await supertest(app)
        .get('/api/v1/providers/builtin')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.provider.slug).toBe('builtin');
      expect(res.body.provider.name).toBe('Built-in Baseline');
    });

    it('allows owner to check provider health', async () => {
      const res = await supertest(app)
        .post('/api/v1/providers/grok/health')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.health).toBeDefined();
      expect(['healthy', 'degraded', 'offline']).toContain(res.body.health.status);
    });

    it('forbids non-owner from triggering health checks', async () => {
      const res = await supertest(app)
        .post('/api/v1/providers/grok/health')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Model Registry', () => {
    it('lists available models and capabilities', async () => {
      const res = await supertest(app)
        .get('/api/v1/models')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.models.length).toBeGreaterThan(0);
      
      const grokModel = res.body.models.find((m: any) => m.slug === 'grok-2-latest');
      expect(grokModel).toBeDefined();
      expect(grokModel.capabilities).toContain('chat.generate');
      expect(grokModel.capabilities).toContain('chat.stream');
    });

    it('allows owner to update model configuration', async () => {
      const res = await supertest(app)
        .patch('/api/v1/models/grok-2-latest')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ priority: 25, display_name: 'Grok 2 Enterprise' });

      expect(res.status).toBe(200);
      expect(res.body.model.priority).toBe(25);
      expect(res.body.model.display_name).toBe('Grok 2 Enterprise');
    });

    it('forbids non-owner from updating model configuration', async () => {
      const res = await supertest(app)
        .patch('/api/v1/models/grok-2-latest')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({ priority: 50 });

      expect(res.status).toBe(403);
    });
  });

  describe('Quota & Usage Management', () => {
    it('returns usage limits for user', async () => {
      const res = await supertest(app)
        .get('/api/v1/usage/limits')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(nonOwnerUserId);
      expect(res.body.limits).toBeDefined();
      expect(res.body.unlimited).toBe(false);
    });

    it('identifies owner as unlimited quota', async () => {
      const res = await supertest(app)
        .get('/api/v1/usage/limits')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.unlimited).toBe(true);
    });

    it('allows owner to update quota limits for a user', async () => {
      const res = await supertest(app)
        .put(`/api/v1/usage/limits/${nonOwnerUserId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ daily_requests: 5, daily_tokens: 10000 });

      expect(res.status).toBe(200);
      expect(res.body.limits.daily_requests).toBe(5);
      expect(res.body.limits.daily_tokens).toBe(10000);
    });

    it('allows owner to access system-wide usage overview', async () => {
      const res = await supertest(app)
        .get('/api/v1/usage/summary')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
      expect(res.body.overview.providerBreakdown).toBeDefined();
      expect(res.body.overview.modelBreakdown).toBeDefined();
    });
  });

  describe('AI Router Routing & Execution', () => {
    it('rejects unauthenticated requests to AI generate', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .send({ prompt: 'Hello Carolina' });

      expect(res.status).toBe(401);
    });

    it('rejects invalid payload without prompt or messages', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request payload');
    });

    it('enforces quota limit when user quota is set to 0', async () => {
      // Set user quota to 0 daily requests
      await dbStore.setUserLimits(nonOwnerUserId, { daily_requests: 0, enabled: true });

      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({ prompt: 'Quota test' });

      expect(res.status).toBe(429);
      expect(res.body.errorCode).toBe('QUOTA_EXCEEDED');
    });

    it('records usage logs upon execution attempts', async () => {
      // Restore normal limits
      await dbStore.setUserLimits(nonOwnerUserId, { daily_requests: 100, enabled: true });

      await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({ prompt: 'Track test' });

      const usageRes = await supertest(app)
        .get('/api/v1/usage')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.summary.totalRequests).toBeGreaterThanOrEqual(1);
    });

    it('generates natural conversational greeting responses', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hi' }],
          routingPolicy: 'balanced',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.provider).toBe('builtin');
      expect(res.body.model).toBe('baseline-v1');
      expect(res.body.text).toBe("Hello! I'm Carolina. How can I help you today?");
      expect(res.body.text).not.toContain('baseline AI provider');
      expect(res.body.text).not.toContain('routing pipelines');
    });

    it('handles conversational queries like "How are you?" and "What can you do?"', async () => {
      const res1 = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'How are you?' }],
        });

      expect(res1.status).toBe(200);
      expect(res1.body.text).toContain("I'm doing well, thank you!");

      const res2 = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'What can you do?' }],
        });

      expect(res2.status).toBe(200);
      expect(res2.body.text).toContain('I can help with basic conversation, calculations');
    });

    it('answers date and time questions accurately from server time', async () => {
      const currentYear = new Date().getUTCFullYear().toString();

      const resDate = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: "What's today's date?" }],
        });

      expect(resDate.status).toBe(200);
      expect(resDate.body.text).toContain("Today's date is");
      expect(resDate.body.text).toContain(currentYear);

      const resDay = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'What day is it?' }],
        });

      expect(resDay.status).toBe(200);
      expect(resDay.body.text).toContain('Today is');

      const resTime = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'What time is it?' }],
        });

      expect(resTime.status).toBe(200);
      expect(resTime.body.text).toContain('The current time is');
      expect(resTime.body.text).toContain('(UTC)');
    });

    it('evaluates multiple arithmetic expressions safely without eval', async () => {
      const testCases = [
        { query: '2 + 2', expected: '2 + 2 equals 4.' },
        { query: '25 + 17', expected: '25 + 17 equals 42.' },
        { query: '100 / 4', expected: '100 / 4 equals 25.' },
        { query: '12 * 8', expected: '12 * 8 equals 96.' },
        { query: '50 - 13', expected: '50 - 13 equals 37.' },
        { query: 'What is 10 / 0?', expected: 'Division by zero is undefined.' },
      ];

      for (const tc of testCases) {
        const res = await supertest(app)
          .post('/api/v1/ai/generate')
          .set('Authorization', `Bearer ${nonOwnerToken}`)
          .send({
            messages: [{ role: 'user', content: tc.query }],
          });

        expect(res.status).toBe(200);
        expect(res.body.text).toBe(tc.expected);
      }
    });

    it('answers system status inquiries cleanly without exposing internals', async () => {
      const res1 = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Are you online?' }],
        });

      expect(res1.status).toBe(200);
      expect(res1.body.text).toBe('All systems are online and operational. I\'m ready to assist.');
      expect(res1.body.text).not.toContain('API');
      expect(res1.body.text).not.toContain('env');

      const res2 = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: "What's your status?" }],
        });

      expect(res2.status).toBe(200);
      expect(res2.body.text).toBe('All systems are online and operational. I\'m ready to assist.');
    });

    it('gracefully handles unsupported requests without pretending or exposing internal errors', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Write a 2000 word sci-fi novel about interstellar travel.' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('builtin');
      expect(res.body.text).toBe("I can help with basic conversation, calculations, system information, and common questions. A more capable AI provider isn't currently available for that request.");
    });

    it('transparently falls back to baseline provider when Grok is unconfigured', async () => {
      // Balanced policy chooses Grok first by priority (10 > 1).
      // Grok fails because no GROK_API_KEY is configured in test env.
      // Router catches the config error, records failure in usage, and falls back to baseline-v1.
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hello there' }],
          routingPolicy: 'balanced',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.provider).toBe('builtin');
      expect(res.body.model).toBe('baseline-v1');
      expect(res.body.text).toBe("Hello! I'm Carolina. How can I help you today?");
      expect(res.body.text).not.toContain('Grok');
      expect(res.body.text).not.toContain('API not configured');
    });

    it('records zero estimated cost for baseline provider usage', async () => {
      dbStore.clearUsage();

      await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Who are you?' }],
          routingPolicy: 'balanced',
        });

      const usageRes = await supertest(app)
        .get('/api/v1/usage')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.summary.successfulRequests).toBe(1);
      expect(usageRes.body.summary.estimatedCost).toBe(0);
    });
  });
});
