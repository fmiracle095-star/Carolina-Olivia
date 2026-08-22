import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireOwner } from '../middleware/auth';
import { aiRouter as routerEngine } from '../ai/router/router';
import { NormalizedAIRequest, ChatMessage } from '../ai/types/ai';

export const mellyRouter = Router();

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(50000),
});

const mellyChatSchema = z.object({
  message: z.string().max(2000).optional(),
  prompt: z.string().max(2000).optional(),
  messages: z.array(messageSchema).optional(),
  conversationId: z.string().nullable().optional(),
  capability: z.string().optional().default('chat.generate'),
  model: z.string().optional(),
  preferredModel: z.string().nullable().optional(),
  preferredProvider: z.string().nullable().optional(),
  routingPolicy: z.enum(['balanced', 'best_quality', 'fastest', 'cheapest', 'local_first', 'cloud_first']).optional().default('balanced'),
}).refine(data => Boolean(data.message || data.prompt || (data.messages && data.messages.length > 0)), {
  message: 'Invalid request payload',
});

mellyRouter.post('/chat', authenticate, requireOwner, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = mellyChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const { message, prompt, messages, conversationId, capability, model, preferredModel, preferredProvider, routingPolicy } = parsed.data;

    let finalMessages: ChatMessage[] = [];
    if (messages && messages.length > 0) {
      finalMessages = messages;
    } else {
      const userText = message || prompt || '';
      finalMessages = [{ role: 'user', content: userText }];
    }

    const user = (req as any).user;
    const userId = user?.sub || user?.id || 'owner-user';

    const normalizedReq: NormalizedAIRequest = {
      model: model || preferredModel || undefined,
      messages: finalMessages,
      capability: capability || 'chat.generate',
      preferredModel: preferredModel || model || null,
      preferredProvider: preferredProvider || null,
      routingPolicy,
      conversationId: conversationId || null,
    };

    const result = await routerEngine.route(normalizedReq, {
      userId,
      isOwner: true,
    });

    return res.json({
      status: 'success',
      reply: result.text,
      text: result.text,
      type: 'text',
      requestId: result.requestId,
      provider: result.provider,
      model: result.model,
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

