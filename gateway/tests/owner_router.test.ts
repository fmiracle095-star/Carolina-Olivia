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

describe('Phase 3A — Owner Conversation Router Integration', () => {
  describe('Owner Conversation via /api/v1/melly/chat', () => {
    it('authenticated Owner can send normal conversation and receive Carolina response', async () => {
      const res = await supertest(app)
        .post('/api/v1/melly/chat')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ message: 'Hi' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.reply).toBe("Hello! I'm Carolina. How can I help you today?");
      expect(res.body.provider).toBe('builtin');
      expect(res.body.model).toBe('baseline-v1');
    });

    it('knowledge request reaches orchestration pipeline and returns response', async () => {
      const res = await supertest(app)
        .post('/api/v1/melly/chat')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ message: 'Explain quantum computing in detail' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.orchestration).toBeDefined();
      expect(res.body.orchestration.intent).toBe('knowledge');
      expect(res.body.reply).toBeDefined();
    });

    it('privileged operation query explains security boundary and does not auto-execute', async () => {
      const res = await supertest(app)
        .post('/api/v1/melly/chat')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ message: 'Check my owner vault' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toContain('Privileged owner operations');
      expect(res.body.reply).toContain('require explicit action');
    });

    it('unauthenticated request is rejected with 401', async () => {
      const res = await supertest(app)
        .post('/api/v1/melly/chat')
        .send({ message: 'Hi' });

      expect(res.status).toBe(401);
    });

    it('authenticated non-owner is rejected with 403', async () => {
      const res = await supertest(app)
        .post('/api/v1/melly/chat')
        .set('Authorization', `Bearer ${validNonOwnerToken}`)
        .send({ message: 'Hi' });

      expect(res.status).toBe(403);
    });
  });

  describe('General Chat vs Owner Chat Router Alignment', () => {
    it('General Chat (/api/v1/ai/generate) also accepts authenticated requests', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${validOwnerToken}`)
        .send({ prompt: 'What is 15 + 27?' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.text).toBe('15 + 27 equals 42.');
      expect(res.body.orchestration).toBeDefined();
    });

    it('General Chat rejects unauthenticated request', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .send({ prompt: 'Hi' });

      expect(res.status).toBe(401);
    });
  });
});
