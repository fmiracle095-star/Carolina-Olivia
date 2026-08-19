import crypto from 'crypto';
import { env } from '../config/env';

export const ALLOWED_OPERATIONS = [
  'SYS_MEM_CHECK',
  'SYS_DISK_CHECK',
  'NETWORK_PING'
] as const;

export type TermuxOperation = typeof ALLOWED_OPERATIONS[number];

export interface TermuxPayload {
  operation: TermuxOperation;
  nonce: string;
  timestamp: number;
}

// In a real system, use Redis to store used nonces with a TTL of the clock skew window.
const usedNonces = new Set<string>();

export function createTermuxPayload(operation: TermuxOperation) {
  if (!ALLOWED_OPERATIONS.includes(operation)) {
    throw new Error('Invalid Termux operation');
  }

  const payload: TermuxPayload = {
    operation,
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };

  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', env.TERMUX_AUTH_SECRET)
    .update(payloadStr)
    .digest('hex');

  return {
    payload: payloadStr,
    signature,
  };
}

export function verifyTermuxPayload(payloadStr: string, signature: string) {
  let payload: TermuxPayload;
  try {
    payload = JSON.parse(payloadStr);
  } catch (err) {
    throw new Error('Malformed payload');
  }

  if (!ALLOWED_OPERATIONS.includes(payload.operation)) {
    throw new Error('Unknown operation identifier');
  }

  const expectedSig = crypto
    .createHmac('sha256', env.TERMUX_AUTH_SECRET)
    .update(payloadStr)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid Termux signature');
  }
  
  const now = Date.now();
  if (Math.abs(now - payload.timestamp) > 30000) { 
    throw new Error('Payload expired or outside clock-skew window');
  }

  if (usedNonces.has(payload.nonce)) {
    throw new Error('Replayed request ID');
  }

  usedNonces.add(payload.nonce);

  return payload;
}
