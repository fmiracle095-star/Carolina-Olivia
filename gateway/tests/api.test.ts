import supertest from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const supabaseUrl = new URL(env.SUPABASE_URL);
const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

const token = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

describe('API Endpoints', () => {
  it('Melly chat requires valid payload', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request payload');
  });

  it('Melly chat rejects oversized message', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'a'.repeat(3000) });
    expect(res.status).toBe(400);
  });
  
  it('Melly chat routes through authoritative AI router', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.reply).toBeDefined();
    expect(res.body.reply).toContain('Carolina');
  });

  it('System status returns accurate unconfigured states', async () => {
    const res = await supertest(app).get('/api/v1/system/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('NOT CONNECTED');
    expect(res.body.vault).toBe('NOT CONFIGURED');
    expect(res.body.aiRouter).toBe('STANDBY');
    expect(res.body.provider).toBe('NOT CONFIGURED');
    expect(res.body.termux).toBe('UNAVAILABLE');
  });
});
