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

    const responseText = this.generateResponse(lastUserMsg);
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

  private generateResponse(input: string): string {
    if (!input) {
      return "Hello! I'm Carolina. How can I help you today?";
    }

    const trimmed = input.trim();
    const normalized = trimmed.toLowerCase();

    // 1. Safe Arithmetic Evaluation (prioritized before conversational checks)
    const mathResult = this.tryEvaluateArithmetic(trimmed);
    if (mathResult !== null) {
      return mathResult;
    }

    // 2. Date and Time Awareness
    const dateTimeResult = this.tryHandleDateTime(normalized);
    if (dateTimeResult !== null) {
      return dateTimeResult;
    }

    // 3. Conversational: Greetings
    if (/^(hi|hello|hey|greetings|good\s+morning|good\s+afternoon|good\s+evening|howdy|yo)\b/i.test(normalized)) {
      return "Hello! I'm Carolina. How can I help you today?";
    }

    // 4. Conversational: How are you?
    if (/\b(how\s+are\s+you|how\s+are\s+you\s+doing|how's\s+it\s+going|hows\s+it\s+going|how\s+do\s+you\s+feel|how\s+are\s+things)\b/i.test(normalized)) {
      return "I'm doing well, thank you! Ready to assist you. How can I help today?";
    }

    // 5. Conversational: Introductions / Identity
    if (/\b(who\s+are\s+you|what\s+is\s+your\s+name|what's\s+your\s+name|whats\s+your\s+name|who\s+is\s+carolina|introduce\s+yourself|tell\s+me\s+about\s+yourself)\b/i.test(normalized)) {
      return "I'm Carolina, your assistant on the Carolina-Olivia platform. I'm here to help with conversation, calculations, system information, and everyday queries.";
    }

    // 6. Conversational: What can you do / Capabilities / Help
    if (/\b(what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|what\s+can\s+you\s+help\s+(?:me\s+)?with|how\s+can\s+you\s+help|what\s+can\s+i\s+ask\s+you|help)\b/i.test(normalized)) {
      return "I can help with basic conversation, calculations, date and time, system status, and general questions.";
    }

    // 7. Conversational: Goodbyes
    if (/\b(goodbye|bye|see\s+you|see\s+ya|farewell|have\s+a\s+good\s+(?:day|night|evening)|talk\s+to\s+you\s+later)\b/i.test(normalized)) {
      return "Goodbye! Feel free to reach out whenever you need assistance.";
    }

    // 8. Conversational: Thanks / Gratitude
    if (/\b(thank\s+you|thanks|thank\s+you\s+so\s+much|much\s+appreciated|thanks\s+a\s+lot|thx)\b/i.test(normalized)) {
      return "You're welcome! Let me know if you need anything else.";
    }

    // 9. Conversational: Simple affirmations / acknowledgments
    if (/^(ok|okay|got\s+it|sounds\s+good|cool|nice|great|awesome|perfect|understood)\b/i.test(normalized)) {
      return "Glad to hear that. Let me know how else I can assist you.";
    }

    // 10. System Status
    if (/\b(are\s+you\s+online|are\s+you\s+working|what(?:'s|\s+is)\s+your\s+status|are\s+(?:your\s+)?systems\s+operational|system\s+status|is\s+the\s+system\s+(?:up|online|working)|status\s+check|ping)\b/i.test(normalized)) {
      return "All systems are online and operational. I'm ready to assist.";
    }

    // 11. Operations Assistance: Model & Provider queries
    if (/\b(which\s+model|what\s+model|current\s+model)\b/i.test(normalized)) {
      return "I'm currently responding as Carolina Baseline v1.";
    }
    if (/\b(what\s+ai\s+providers|which\s+providers|available\s+providers)\b/i.test(normalized)) {
      return "Carolina provides access to built-in operational capabilities and configured AI providers managed through the gateway.";
    }

    // 12. Graceful fallback for unsupported requests
    return "I can help with basic conversation, calculations, system information, and common questions. A more capable AI provider isn't currently available for that request.";
  }

  // --- Date & Time Handling ---
  private tryHandleDateTime(normalized: string): string | null {
    const now = new Date();

    const isDateQuery = /\b(what(?:'s|\s+is)\s+(?:today(?:'s)?|the\s+current)\s+date|what\s+date\s+is\s+it|what\s+is\s+the\s+date\s+today|today(?:'s)?\s+date|current\s+date|what\s+is\s+today(?:'s)?\s+date)\b/i.test(normalized);
    const isDayQuery = /\b(what\s+day\s+(?:is\s+it|is\s+today|of\s+the\s+week\s+is\s+it)|what's\s+the\s+day|what\s+day\s+is\s+today)\b/i.test(normalized);
    const isTimeQuery = /\b(what(?:'s|\s+is)\s+(?:the\s+)?(?:current\s+)?time|what\s+time\s+is\s+it|current\s+time|time\s+check)\b/i.test(normalized);
    const isYearQuery = /\b(what\s+year\s+is\s+it|what(?:'s|\s+is)\s+(?:the\s+)?current\s+year)\b/i.test(normalized);
    const isMonthQuery = /\b(what\s+month\s+is\s+it|what(?:'s|\s+is)\s+(?:the\s+)?current\s+month)\b/i.test(normalized);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayName = days[now.getUTCDay()];
    const monthName = months[now.getUTCMonth()];
    const dateNum = now.getUTCDate();
    const year = now.getUTCFullYear();

    if (isDateQuery || (isDayQuery && isDateQuery)) {
      return `Today's date is ${dayName}, ${monthName} ${dateNum}, ${year}.`;
    }

    if (isDayQuery) {
      return `Today is ${dayName}, ${monthName} ${dateNum}, ${year}.`;
    }

    if (isTimeQuery) {
      let hours = now.getUTCHours();
      const minutes = now.getUTCMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `The current time is ${hours}:${minutes} ${ampm} (UTC).`;
    }

    if (isYearQuery) {
      return `The current year is ${year}.`;
    }

    if (isMonthQuery) {
      return `The current month is ${monthName} ${year}.`;
    }

    return null;
  }

  // --- Safe Arithmetic Engine (No eval / Function) ---
  private tryEvaluateArithmetic(input: string): string | null {
    // Check if input looks like an arithmetic question or expression
    const clean = input.trim().replace(/\?+$/, '').trim();

    // Strip leading natural language prefixes like "what is", "calculate", "how much is", "evaluate"
    const stripped = clean.replace(/^(?:what\s+is|calculate|evaluate|how\s+much\s+is|compute)\s+/i, '').trim();

    // Translate word operators to symbols
    let expr = stripped
      .replace(/\bplus\b/gi, '+')
      .replace(/\bminus\b/gi, '-')
      .replace(/\btimes\b/gi, '*')
      .replace(/\bmultiplied\s+by\b/gi, '*')
      .replace(/\bdivided\s+by\b/gi, '/')
      .replace(/\bmod(?:ulo)?\b/gi, '%')
      .replace(/\bto\s+the\s+power\s+of\b/gi, '^')
      .replace(/[xX×]/g, '*')
      .replace(/÷/g, '/');

    // Verify expression only contains numbers, operators, parens, decimals, spaces
    if (!/^[\d\s\+\-\*\/\%\^\(\)\.]+$/.test(expr)) {
      return null;
    }

    // Must contain at least one operator and at least one digit
    if (!/[\+\-\*\/\%\^]/.test(expr) || !/\d/.test(expr)) {
      return null;
    }

    try {
      const result = this.parseAndComputeExpression(expr);
      if (result === null || !isFinite(result)) {
        return null;
      }

      // Format clean output e.g. "2 + 2 equals 4."
      // Format display of stripped original expression or clean representation
      const displayExpr = stripped
        .replace(/[xX×]/g, '*')
        .replace(/÷/g, '/');

      return `${displayExpr} equals ${result}.`;
    } catch (e: any) {
      if (e?.message === 'DIVISION_BY_ZERO') {
        return 'Division by zero is undefined.';
      }
      return null;
    }
  }

  /**
   * Safe Recursive Descent Parser & Evaluator
   * Grammar:
   *   Expr    -> Term (('+' | '-') Term)*
   *   Term    -> Factor (('*' | '/' | '%') Factor)*
   *   Factor  -> Power ('^' Factor)?
   *   Power   -> ('+' | '-')? Primary
   *   Primary -> NUMBER | '(' Expr ')'
   */
  private parseAndComputeExpression(expr: string): number | null {
    const tokens = this.tokenize(expr);
    if (!tokens || tokens.length === 0) return null;

    let pos = 0;

    const peek = () => tokens[pos];
    const consume = (expected?: string) => {
      const token = tokens[pos];
      if (expected && token !== expected) {
        throw new Error(`Unexpected token ${token}, expected ${expected}`);
      }
      pos++;
      return token;
    };

    const parseExpr = (): number => {
      let val = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = consume();
        const nextVal = parseTerm();
        if (op === '+') val += nextVal;
        else val -= nextVal;
      }
      return val;
    };

    const parseTerm = (): number => {
      let val = parseFactor();
      while (peek() === '*' || peek() === '/' || peek() === '%') {
        const op = consume();
        const nextVal = parseFactor();
        if (op === '*') {
          val *= nextVal;
        } else if (op === '/') {
          if (nextVal === 0) throw new Error('DIVISION_BY_ZERO');
          val /= nextVal;
        } else if (op === '%') {
          if (nextVal === 0) throw new Error('DIVISION_BY_ZERO');
          val %= nextVal;
        }
      }
      return val;
    };

    const parseFactor = (): number => {
      const val = parseUnary();
      if (peek() === '^') {
        consume('^');
        const exponent = parseFactor(); // Right-associative
        return Math.pow(val, exponent);
      }
      return val;
    };

    const parseUnary = (): number => {
      if (peek() === '+') {
        consume('+');
        return parseUnary();
      }
      if (peek() === '-') {
        consume('-');
        return -parseUnary();
      }
      return parsePrimary();
    };

    const parsePrimary = (): number => {
      const token = peek();
      if (token === '(') {
        consume('(');
        const val = parseExpr();
        consume(')');
        return val;
      }
      if (token && /^[\d\.]+$/.test(token)) {
        consume();
        const num = parseFloat(token);
        if (isNaN(num)) throw new Error('Invalid number');
        return num;
      }
      throw new Error(`Unexpected token ${token}`);
    };

    const result = parseExpr();
    if (pos < tokens.length) {
      throw new Error('Extra tokens remaining');
    }
    return result;
  }

  private tokenize(expr: string): string[] | null {
    const tokens: string[] = [];
    let i = 0;
    const s = expr.trim();

    while (i < s.length) {
      const char = s[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      if (['+', '-', '*', '/', '%', '^', '(', ')'].includes(char)) {
        tokens.push(char);
        i++;
        continue;
      }
      if (/[\d\.]/.test(char)) {
        let numStr = '';
        while (i < s.length && /[\d\.]/.test(s[i])) {
          numStr += s[i];
          i++;
        }
        tokens.push(numStr);
        continue;
      }
      return null;
    }
    return tokens;
  }
}
