import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';
import { aiRouter as routerEngine } from '../ai/router/router';
import { ChatMessage, NormalizedAIRequest } from '../ai/types/ai';

export const aiRouter = Router();

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(50000),
});

const generateSchema = z.object({
  prompt: z.string().max(50000).optional(),
  messages: z.array(messageSchema).optional(),
  capability: z.string().default('chat.generate'),
  model: z.string().optional(),
  preferredModel: z.string().nullable().optional(),
  preferredProvider: z.string().nullable().optional(),
  routingPolicy: z.enum(['balanced', 'best_quality', 'fastest', 'cheapest', 'local_first', 'cloud_first']).optional().default('balanced'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(131072).optional(),
  conversationId: z.string().nullable().optional(),
}).refine(data => Boolean(data.prompt || (data.messages && data.messages.length > 0)), {
  message: 'Either prompt or non-empty messages array must be provided',
});

aiRouter.post('/generate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: parsed.error.issues,
      });
    }

    const { prompt, messages, capability, model, preferredModel, preferredProvider, routingPolicy, temperature, maxTokens, conversationId } = parsed.data;

    let finalMessages: ChatMessage[] = [];
    if (messages && messages.length > 0) {
      finalMessages = messages;
    } else if (prompt) {
      finalMessages = [{ role: 'user', content: prompt }];
    }

    const user = (req as any).user;
    const userId = user?.sub || user?.id || 'anonymous-user';
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);

    const normalizedReq: NormalizedAIRequest = {
      model: model || preferredModel || undefined,
      messages: finalMessages,
      capability: capability || 'chat.generate',
      preferredModel: preferredModel || model || null,
      preferredProvider: preferredProvider || null,
      routingPolicy,
      temperature,
      maxTokens,
      conversationId: conversationId || null,
    };

    const result = await routerEngine.route(normalizedReq, {
      userId,
      isOwner,
    });

    return res.json({
      status: 'success',
      requestId: result.requestId,
      provider: result.provider,
      model: result.model,
      text: result.text,
      finishReason: result.finishReason,
      usage: result.usage,
      latencyMs: result.latencyMs,
      orchestration: result.orchestration,
    });
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const isClientError = statusCode === 400 || statusCode === 429;
    const isSafeProviderError = statusCode === 503 && err.errorCode === 'PROVIDER_UNAVAILABLE';
    const message = isClientError || isSafeProviderError
      ? err.message
      : 'Carolina is temporarily unable to process this request. Please try again shortly.';

    return res.status(statusCode).json({
      error: message,
      errorCode: err.errorCode || 'AI_ROUTER_ERROR',
    });
  }
});

aiRouter.post('/stream', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: parsed.error.issues,
      });
    }

    const { prompt, messages, capability, model, preferredModel, preferredProvider, routingPolicy, temperature, maxTokens, conversationId } = parsed.data;

    let finalMessages: ChatMessage[] = [];
    if (messages && messages.length > 0) {
      finalMessages = messages;
    } else if (prompt) {
      finalMessages = [{ role: 'user', content: prompt }];
    }

    const user = (req as any).user;
    const userId = user?.sub || user?.id || 'anonymous-user';
    const isOwner = Boolean(user?.sub && user.sub === env.OWNER_UUID);

    const normalizedReq: NormalizedAIRequest = {
      model: model || preferredModel || undefined,
      messages: finalMessages,
      capability: capability || 'chat.stream',
      preferredModel: preferredModel || model || null,
      preferredProvider: preferredProvider || null,
      routingPolicy,
      temperature,
      maxTokens,
      conversationId: conversationId || null,
      stream: true,
    };

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    for await (const chunk of routerEngine.streamRoute(normalizedReq, { userId, isOwner })) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    if (!res.headersSent) {
      return res.status(statusCode).json({
        error: err.message || 'AI streaming error',
        errorCode: err.errorCode || 'AI_STREAM_ERROR',
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Streaming failed', isComplete: true })}\n\n`);
      res.end();
    }
  }
});
