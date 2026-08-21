import supertest from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { taskAnalyzer } from '../src/ai/orchestration/task-analyzer';
import { executionPlanner } from '../src/ai/orchestration/planner';
import { orchestrationEvents } from '../src/ai/orchestration/events';

const supabaseUrl = new URL(env.SUPABASE_URL);
const expectedIssuer = `${supabaseUrl.origin}/auth/v1`;

const ownerToken = jwt.sign(
  { sub: env.OWNER_UUID, aud: 'authenticated', iss: expectedIssuer },
  env.SUPABASE_JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Phase 2D Intelligence Orchestration Layer', () => {
  describe('TaskAnalyzer Unit Tests', () => {
    it('correctly classifies conversational intent and low complexity', () => {
      const result = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'Hi Carolina' }],
      });
      expect(result.intent).toBe('conversation');
      expect(result.complexity).toBe('low');
    });

    it('correctly classifies calculation intent', () => {
      const result = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'What is 15 + 27?' }],
      });
      expect(result.intent).toBe('calculation');
      expect(result.complexity).toBe('low');
    });

    it('correctly classifies coding intent and medium complexity', () => {
      const result = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'Write a Python function to parse JSON and calculate stats.' }],
      });
      expect(result.intent).toBe('coding');
      expect(result.complexity).toBe('medium');
    });

    it('correctly classifies knowledge intent and high complexity', () => {
      const result = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'Explain quantum mechanics and general relativity integration in distributed systems design.' }],
      });
      expect(result.intent).toBe('knowledge');
      expect(result.complexity).toBe('high');
    });

    it('correctly classifies creative intent', () => {
      const result = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'Write a short story about a space explorer.' }],
      });
      expect(result.intent).toBe('creative');
      expect(result.complexity).toBe('medium');
    });

    it('correctly classifies system intent', () => {
      const result = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'What models are active in the system?' }],
      });
      expect(result.intent).toBe('system');
      expect(result.complexity).toBe('low');
    });
  });

  describe('ExecutionPlanner Unit Tests', () => {
    it('creates an execution plan for baseline-suitable queries', () => {
      const analysis = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'Hi' }],
      });
      const plan = executionPlanner.createPlan(analysis, {
        messages: [{ role: 'user', content: 'Hi' }],
      });
      expect(plan.intent).toBe('conversation');
      expect(plan.preferredPolicy).toBe('balanced');
      expect(plan.requiresGeneralAI).toBe(false);
    });

    it('creates an execution plan for complex coding queries requiring general AI', () => {
      const analysis = taskAnalyzer.analyze({
        messages: [{ role: 'user', content: 'Write an asynchronous microservice in TypeScript' }],
      });
      const plan = executionPlanner.createPlan(analysis, {
        messages: [{ role: 'user', content: 'Write an asynchronous microservice in TypeScript' }],
      });
      expect(plan.intent).toBe('coding');
      expect(plan.requiresGeneralAI).toBe(true);
      expect(plan.preferredPolicy).toBe('best_quality');
    });
  });

  describe('OrchestrationEvents Unit Tests', () => {
    it('tracks event sequence per request lifecycle', () => {
      const reqId = 'test-request-123';
      orchestrationEvents.emit(reqId, 'REQUEST_RECEIVED', {});
      orchestrationEvents.emit(reqId, 'ANALYZING', {});
      orchestrationEvents.emit(reqId, 'PLANNING', { intent: 'conversation' });
      orchestrationEvents.emit(reqId, 'COMPLETED', { provider: 'builtin' });

      const events = orchestrationEvents.getEventsForRequest(reqId);
      expect(events.length).toBe(4);
      expect(events[0].type).toBe('REQUEST_RECEIVED');
      expect(events[1].type).toBe('ANALYZING');
      expect(events[2].type).toBe('PLANNING');
      expect(events[3].type).toBe('COMPLETED');
    });
  });

  describe('AIRouter Integration with Orchestration Metadata', () => {
    it('includes orchestration metadata in generate API response', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hi Carolina' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.text).toBeDefined();
      expect(res.body.orchestration).toBeDefined();
      expect(res.body.orchestration.intent).toBe('conversation');
      expect(res.body.orchestration.complexity).toBe('low');
      expect(res.body.orchestration.executionPlan).toBeDefined();
      expect(Array.isArray(res.body.orchestration.events)).toBe(true);
    });

    it('handles invalid model selection safely without exposing secrets', async () => {
      const res = await supertest(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          preferredModel: 'invalid-nonexistent-model-xyz',
        });

      expect(res.status).toBe(503);
      expect(res.body.error).toBeDefined();
      expect(res.body.error).not.toContain('SECRET');
      expect(res.body.error).not.toContain('API_KEY');
    });
  });
});
