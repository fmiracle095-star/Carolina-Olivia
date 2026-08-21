import { NormalizedAIRequest, ChatMessage } from '../types/ai';
import { TaskAnalysis, TaskIntent, TaskComplexity } from './types';

export class TaskAnalyzer {
  public analyze(request: NormalizedAIRequest): TaskAnalysis {
    const messages = request.messages || [];
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserContent = userMessages.length > 0 
      ? userMessages[userMessages.length - 1].content.trim() 
      : (messages[messages.length - 1]?.content?.trim() || '');

    const normalized = lastUserContent.toLowerCase();

    // 1. Owner & Provider & System Operations
    if (this.isProviderManagement(normalized)) {
      return {
        intent: 'provider_management',
        complexity: 'low',
        requiredCapabilities: ['system_information', 'chat.generate'],
        confidence: 0.95,
        requiresGeneralAI: false,
      };
    }

    if (this.isSystemQuery(normalized)) {
      return {
        intent: 'system',
        complexity: 'low',
        requiredCapabilities: ['system_information', 'chat.generate'],
        confidence: 0.95,
        requiresGeneralAI: false,
      };
    }

    if (this.isOwnerOperation(normalized)) {
      return {
        intent: 'owner_operation',
        complexity: 'medium',
        requiredCapabilities: ['system_information', 'chat.generate'],
        confidence: 0.9,
        requiresGeneralAI: false,
      };
    }

    // 2. Calculation
    if (this.isCalculation(lastUserContent, normalized)) {
      return {
        intent: 'calculation',
        complexity: 'low',
        requiredCapabilities: ['calculation', 'chat.generate'],
        confidence: 0.95,
        requiresGeneralAI: false,
      };
    }

    // 3. Coding
    if (this.isCoding(lastUserContent, normalized)) {
      const complexity = this.determineCodingComplexity(normalized);
      return {
        intent: 'coding',
        complexity,
        requiredCapabilities: ['code_generation', 'chat.generate'],
        confidence: 0.9,
        requiresGeneralAI: true,
      };
    }

    // 4. Conversation (Greetings, Identity, Thanks, Goodbyes)
    if (this.isConversation(normalized)) {
      return {
        intent: 'conversation',
        complexity: 'low',
        requiredCapabilities: ['chat.generate'],
        confidence: 0.95,
        requiresGeneralAI: false,
      };
    }

    // 5. Translation
    if (this.isTranslation(normalized)) {
      return {
        intent: 'translation',
        complexity: 'medium',
        requiredCapabilities: ['translation', 'chat.generate'],
        confidence: 0.9,
        requiresGeneralAI: true,
      };
    }

    // 6. Summarization
    if (this.isSummarization(normalized)) {
      return {
        intent: 'summarization',
        complexity: 'medium',
        requiredCapabilities: ['reasoning', 'chat.generate'],
        confidence: 0.88,
        requiresGeneralAI: true,
      };
    }

    // 7. Creative
    if (this.isCreative(normalized)) {
      return {
        intent: 'creative',
        complexity: 'medium',
        requiredCapabilities: ['chat.generate'],
        confidence: 0.85,
        requiresGeneralAI: true,
      };
    }

    // 8. Reasoning vs Knowledge
    if (this.isReasoning(normalized)) {
      const complexity = this.determineComplexity(normalized, 'high');
      return {
        intent: 'reasoning',
        complexity,
        requiredCapabilities: ['reasoning', 'chat.generate'],
        confidence: 0.88,
        requiresGeneralAI: true,
      };
    }

    if (this.isKnowledge(normalized)) {
      const complexity = this.determineComplexity(normalized, 'medium');
      return {
        intent: 'knowledge',
        complexity,
        requiredCapabilities: ['reasoning', 'chat.generate'],
        confidence: 0.85,
        requiresGeneralAI: true,
      };
    }

    // Default fallback analysis
    return {
      intent: 'knowledge',
      complexity: 'medium',
      requiredCapabilities: ['chat.generate'],
      confidence: 0.7,
      requiresGeneralAI: true,
    };
  }

  private isProviderManagement(text: string): boolean {
    return /\b(available models|list models|which models|what models|available providers|list providers|which providers|what providers)\b/i.test(text);
  }

  private isSystemQuery(text: string): boolean {
    return /\b(system status|cluster health|are systems operational|ping|status check|gateway status)\b/i.test(text);
  }

  private isOwnerOperation(text: string): boolean {
    return /\b(owner operation|overseer command|system audit|vault status|termux status|local agent status)\b/i.test(text);
  }

  private isCalculation(raw: string, text: string): boolean {
    // Check if simple math expression like "27 * 14", "27 x 14", "what is 27 * 14", "calculate 100/4"
    if (/^\s*(?:what\s+is\s+|calculate\s+|compute\s+|eval\s+)?[\d\s\.\+\-\*\/\(\)\^x×÷%]+\s*\??\s*$/i.test(raw)) {
      return true;
    }
    return /\b(calculate|compute|solve|math|arithmetic|square root|percentage of)\b/i.test(text);
  }

  private isCoding(raw: string, text: string): boolean {
    if (raw.includes('```')) return true;
    return /\b(python|javascript|typescript|java|c\+\+|rust|golang|code|program|function|script|algorithm|regex|csv|dataframe|api route|class|parse|debug|syntax)\b/i.test(text)
      || /\b(write a|create a|build a)\s+(python|js|ts|script|program|function|code|app)\b/i.test(text);
  }

  private isConversation(text: string): boolean {
    // Greetings, Identity, How are you, Goodbyes, Thanks, Ok
    if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|yo|howdy)\b/i.test(text)) return true;
    if (/\b(who\s+are\s+you|what\s+are\s+you|what\s+is\s+carolina|tell\s+me\s+about\s+yourself|introduce\s+yourself|what\s+is\s+your\s+purpose|your\s+name|how\s+are\s+you|what's\s+up|whats\s+up|sup)\b/i.test(text)) return true;
    if (/\b(thanks|thank\s+you|goodbye|bye|ok|okay|sounds\s+good)\b/i.test(text)) return true;
    if (/^(help|help\s+me)$/i.test(text)) return true;
    return false;
  }

  private isTranslation(text: string): boolean {
    return /\b(translate|translation|how\s+do\s+you\s+say|in\s+french|in\s+spanish|in\s+german|in\s+chinese|in\s+japanese)\b/i.test(text);
  }

  private isSummarization(text: string): boolean {
    return /\b(summarize|summary|tldr|tl;dr|key\s+takeaways|bullet\s+points\s+of)\b/i.test(text);
  }

  private isCreative(text: string): boolean {
    return /\b(poem|poetry|story|creative|essay|joke|song|lyrics|rap|fiction)\b/i.test(text);
  }

  private isReasoning(text: string): boolean {
    return /\b(reason|logic|proof|derive|analyze\s+critically|step-by-step\s+reasoning|compare\s+and\s+contrast|solve\s+puzzle)\b/i.test(text);
  }

  private isKnowledge(text: string): boolean {
    return /\b(explain|what\s+is|who\s+was|history\s+of|how\s+does|why\s+does|describe|overview|definition|tell\s+me\s+about)\b/i.test(text);
  }

  private determineCodingComplexity(text: string): TaskComplexity {
    if (/\b(architecture|framework|full\s+app|refactor|distributed|optimization|concurrency|async|recursion)\b/i.test(text)) {
      return 'high';
    }
    return 'medium';
  }

  private determineComplexity(text: string, defaultLevel: TaskComplexity): TaskComplexity {
    if (text.length > 500 || /\b(detailed|comprehensive|in-depth|exhaustive|advanced|complex)\b/i.test(text)) {
      return 'high';
    }
    if (text.length < 50 && !/\b(explain|why|how|details)\b/i.test(text)) {
      return 'low';
    }
    return defaultLevel;
  }
}

export const taskAnalyzer = new TaskAnalyzer();
