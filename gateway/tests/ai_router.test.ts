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
      expect(grok.status).toBe('healthy');
      expect(grok.capabilities).toContain('chat.generate');
      expect(grok.api_key).toBeUndefined();
      expect(grok.secret).toBeUndefined();
    });

    it('returns provider details by slug or id', async () => {
      const res = await supertest(app)
        .get('/api/v1/providers/grok')
        .set('Authorization', `Bearer ${nonOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.provider.slug).toBe('grok');
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
  });
});
