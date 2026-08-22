import { NormalizedAIResponse } from '../types/ai';

export interface ResponseValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedText?: string;
}

export class ResponseValidator {
  public validate(response: NormalizedAIResponse | any): ResponseValidationResult {
    if (!response) {
      return { isValid: false, reason: 'Response object is null or undefined' };
    }

    if (typeof response !== 'object') {
      return { isValid: false, reason: 'Response is not a valid object' };
    }

    // Check for explicit error payloads
    if (response.error || response.errorCode || response.errorMessage) {
      return { isValid: false, reason: 'Response contains an error payload' };
    }

    const text = typeof response.text === 'string' ? response.text : '';
    if (!text || text.trim().length === 0) {
      return { isValid: false, reason: 'Response contains empty text content' };
    }

    // Check for leaked secrets / API keys
    if (
      /xai-[a-zA-Z0-9_-]{15,}/i.test(text) ||
      /bearer\s+eyJ[a-zA-Z0-9_-]+/i.test(text) ||
      /SUPABASE_JWT_SECRET|TERMUX_AUTH_SECRET|ENCRYPTION_KEY/i.test(text)
    ) {
      return { isValid: false, reason: 'Response contains leaked API credential or secret token' };
    }

    // Check for raw exception stack traces or node error dump
    if (
      /\b(?:at\s+[a-zA-Z0-9_$./]+\s+\([^)]+:\d+:\d+\)|node_modules\/|InternalServerError|ECONNREFUSED|ETIMEDOUT)\b/i.test(text)
    ) {
      return { isValid: false, reason: 'Response contains raw stack trace or internal network exception' };
    }

    return { isValid: true, sanitizedText: text };
  }
}

export const responseValidator = new ResponseValidator();
