import { ProviderAdapter } from './base';
import { 
  NormalizedAIRequest, 
  NormalizedAIResponse, 
  ProviderHealth 
} from '../types/ai';

export class BaselineProviderAdapter implements ProviderAdapter {
  public readonly slug = 'builtin';
  public readonly name = 'Built-in Baseline';

  async healthCheck(): Promise<ProviderHealth> {
    return {
      status: 'healthy',
      latencyMs: 1,
      message: 'Built-in baseline AI provider is operational',
      checkedAt: new Date().toISOString(),
    };
  }

  async generate(request: NormalizedAIRequest): Promise<NormalizedAIResponse> {
    const start = performance.now();
    const requestId = request.requestId || crypto.randomUUID();
    const model = request.model || 'baseline-v1';

    // Extract the latest user message
    const userMessages = request.messages.filter(m => m.role === 'user');
    const lastUserMsg = userMessages.length > 0
      ? userMessages[userMessages.length - 1].content.trim()
      : (request.messages[request.messages.length - 1]?.content?.trim() || '');

    const responseText = this.generateDeterministicResponse(lastUserMsg);
    const latencyMs = Math.max(1, Math.round(performance.now() - start));

    // Calculate sensible estimated tokens (approx 4 chars per token)
    const promptChars = request.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const inputTokens = Math.max(1, Math.round(promptChars / 4));
    const outputTokens = Math.max(1, Math.round(responseText.length / 4));
    const totalTokens = inputTokens + outputTokens;

    return {
      requestId,
      provider: this.slug,
      model,
      text: responseText,
      finishReason: 'stop',
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
      latencyMs,
    };
  }

  private generateDeterministicResponse(input: string): string {
    if (!input) {
      return "Hello. I'm Carolina. The baseline AI provider is active and ready.";
    }

    const trimmed = input.trim();
    const normalized = trimmed.toLowerCase();

    // 1. Math and Arithmetic detection (e.g. "What is 2 + 2?", "2+2", "5 * 10", "calculate 100 / 4")
    const mathMatch = normalized.match(/(?:what\s+is\s+|calculate\s+|evaluate\s+)?(\d+(?:\.\d+)?)\s*([\+\-\*\/xX]|plus|minus|times|multiplied\s+by|divided\s+by)\s*(\d+(?:\.\d+)?)(?:\s*\?)?/i);
    if (mathMatch) {
      const num1 = parseFloat(mathMatch[1]);
      const op = mathMatch[2].toLowerCase();
      const num2 = parseFloat(mathMatch[3]);

      if (op === '+' || op === 'plus') {
        const result = num1 + num2;
        return `${num1} + ${num2} equals ${result}.`;
      }
      if (op === '-' || op === 'minus') {
        const result = num1 - num2;
        return `${num1} - ${num2} equals ${result}.`;
      }
      if (op === '*' || op === 'x' || op === 'times' || op === 'multiplied by') {
        const result = num1 * num2;
        return `${num1} * ${num2} equals ${result}.`;
      }
      if (op === '/' || op === 'divided by') {
        if (num2 === 0) {
          return 'Division by zero is undefined.';
        }
        const result = num1 / num2;
        return `${num1} / ${num2} equals ${result}.`;
      }
    }

    // 2. Greetings
    if (/^(hi|hello|hey|greetings|good\s+morning|good\s+afternoon|good\s+evening|howdy)\b/i.test(normalized)) {
      return "Hello. I'm Carolina. The baseline AI provider is active and ready.";
    }

    // 3. Identity and capabilities
    if (/(who\s+are\s+you|what\s+are\s+you|your\s+name|who\s+is\s+carolina|introduce\s+yourself)/i.test(normalized)) {
      return "I am Carolina, the operations assistant for Carolina-Olivia. The baseline AI provider is currently active and ready to assist with system operations.";
    }

    // 4. System / Diagnostics / Health check
    if (/(system\s+status|health\s*check|ping|status\s+report|are\s+you\s+active|are\s+you\s+working|uptime)/i.test(normalized)) {
      return "All systems operational. The Carolina Gateway, AI Router, and Baseline Provider are functioning normally.";
    }

    // 5. Help / Assistance inquiries
    if (/^(help|what\s+can\s+you\s+do|capabilities|commands|menu)\b/i.test(normalized)) {
      return "I am Carolina. The AI router baseline provider is active. I can process general queries, arithmetic calculations, system diagnostic checks, and operational commands.";
    }

    // 6. Gratitude / Acknowledgment
    if (/^(thanks|thank\s+you|awesome|great|ok|okay|got\s+it)\b/i.test(normalized)) {
      return "You're welcome! Let me know if you need assistance with anything else.";
    }

    // 7. General structured fallback
    return `Hello. I'm Carolina. The baseline AI provider has received your message: "${trimmed}". All operational systems and routing pipelines are online and ready.`;
  }
}
