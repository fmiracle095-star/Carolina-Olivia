import { NormalizedAIRequest } from '../types/ai';
import { TaskAnalysis, ExecutionPlan, RoutingPolicy } from './types';

export class ExecutionPlanner {
  public createPlan(analysis: TaskAnalysis, request: NormalizedAIRequest): ExecutionPlan {
    const preferredPolicy: RoutingPolicy = (request.routingPolicy as RoutingPolicy) || this.selectPolicy(analysis);

    return {
      intent: analysis.intent,
      complexity: analysis.complexity,
      requiredCapabilities: analysis.requiredCapabilities,
      preferredPolicy,
      preferredProvider: request.preferredProvider || undefined,
      preferredModel: request.preferredModel || request.model || undefined,
      fallbackAllowed: true,
      requiresGeneralAI: analysis.requiresGeneralAI,
      summary: `Execution plan generated for intent "${analysis.intent}" (${analysis.complexity} complexity)`,
    };
  }

  private selectPolicy(analysis: TaskAnalysis): RoutingPolicy {
    if (analysis.complexity === 'high' || analysis.intent === 'coding' || analysis.intent === 'reasoning') {
      return 'best_quality';
    }
    return 'balanced';
  }
}

export const executionPlanner = new ExecutionPlanner();
