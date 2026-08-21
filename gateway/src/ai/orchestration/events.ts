import crypto from 'crypto';
import { OrchestrationEvent, OrchestrationEventType } from './types';

export class OrchestrationEventManager {
  private recentEvents: OrchestrationEvent[] = [];
  private readonly maxEvents = 500;

  public emit(
    requestId: string,
    type: OrchestrationEventType,
    payload: {
      intent?: any;
      complexity?: any;
      provider?: string;
      model?: string;
      latencyMs?: number;
      message?: string;
      status?: 'info' | 'success' | 'warning' | 'error';
      details?: Record<string, any>;
    }
  ): OrchestrationEvent {
    const event: OrchestrationEvent = {
      id: crypto.randomUUID(),
      requestId,
      type,
      timestamp: new Date().toISOString(),
      intent: payload.intent,
      complexity: payload.complexity,
      provider: payload.provider,
      model: payload.model,
      latencyMs: payload.latencyMs,
      message: payload.message || this.getDefaultMessage(type, payload.provider, payload.model),
      status: payload.status || this.getDefaultStatus(type),
      details: this.sanitizeDetails(payload.details),
    };

    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.shift();
    }

    return event;
  }

  public getEventsForRequest(requestId: string): OrchestrationEvent[] {
    return this.recentEvents.filter(e => e.requestId === requestId);
  }

  public getRecentEvents(limit: number = 50): OrchestrationEvent[] {
    return this.recentEvents.slice(-limit);
  }

  private getDefaultMessage(type: OrchestrationEventType, provider?: string, model?: string): string {
    switch (type) {
      case 'REQUEST_RECEIVED':
        return 'Request received by Carolina Intelligence Orchestrator';
      case 'ANALYZING':
        return 'Analyzing task intent and complexity';
      case 'PLANNING':
        return 'Generating optimal execution plan';
      case 'SELECTING_PROVIDER':
        return 'Selecting best available model provider';
      case 'EXECUTING':
        return `Executing model inference (${provider || 'provider'}/${model || 'model'})`;
      case 'FALLBACK':
        return `Triggering fallback route after candidate failure`;
      case 'COMPLETED':
        return 'Inference execution completed successfully';
      case 'FAILED':
        return 'Request execution failed';
      default:
        return 'Orchestration step';
    }
  }

  private getDefaultStatus(type: OrchestrationEventType): 'info' | 'success' | 'warning' | 'error' {
    switch (type) {
      case 'COMPLETED':
        return 'success';
      case 'FALLBACK':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'info';
    }
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined;
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(details)) {
      if (/key|secret|token|auth|password|credential/i.test(key)) {
        continue;
      }
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = '[Object]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

export const orchestrationEvents = new OrchestrationEventManager();
