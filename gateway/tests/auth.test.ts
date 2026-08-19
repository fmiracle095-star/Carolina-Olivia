import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import app from '../src/index';
import { env } from '../src/config/env';

const supabaseUrl = new URL(env.SUPABASE_URL);
const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

const validOwnerToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);
const validNonOwnerToken = jwt.sign(
  { sub: '11111111-1111-1111-1111-111111111111', aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);
const expiredToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '-1h' }
);
const invalidSigToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  'wrong-secret'
);
const invalidIssuerToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: 'https://attacker.com/auth/v1' },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Auth Middleware', () => {
  it('rejects missing token', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat').send({ message: 'hello' });
    expect(res.status).toBe(401);
  });

  it('rejects malformed token', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', 'Bearer invalid-string')
      .send({ message: 'hello' });
    expect(res.status).toBe(401);
  });

  it('rejects expired token', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token expired');
  });

  it('rejects invalid signature', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${invalidSigToken}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid issuer', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${invalidIssuerToken}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(401);
  });

  it('rejects valid token but not owner', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${validNonOwnerToken}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('accepts valid owner token', async () => {
    const res = await supertest(app).post('/api/v1/melly/chat')
      .set('Authorization', `Bearer ${validOwnerToken}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(200);
  });
});
