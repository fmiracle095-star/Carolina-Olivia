import { createTermuxPayload, verifyTermuxPayload } from '../src/termux/protocol';
import { env } from '../src/config/env';

describe('Termux Protocol', () => {
  it('creates and verifies payload', () => {
    const { payload, signature } = createTermuxPayload('SYS_MEM_CHECK');
    const verified = verifyTermuxPayload(payload, signature);
    expect(verified.operation).toBe('SYS_MEM_CHECK');
  });

  it('fails on invalid operation', () => {
    expect(() => createTermuxPayload('INVALID_CMD' as any)).toThrow();
  });

  it('fails on tampered signature', () => {
    const { payload, signature } = createTermuxPayload('SYS_MEM_CHECK');
    expect(() => verifyTermuxPayload(payload, 'deadbeef')).toThrow();
  });

  it('fails on expired timestamp', () => {
    const { payload, signature } = createTermuxPayload('SYS_MEM_CHECK');
    const parsed = JSON.parse(payload);
    parsed.timestamp = Date.now() - 60000;
    const badPayloadStr = JSON.stringify(parsed);
    const crypto = require('crypto');
    const badSig = crypto.createHmac('sha256', env.TERMUX_AUTH_SECRET).update(badPayloadStr).digest('hex');
    
    expect(() => verifyTermuxPayload(badPayloadStr, badSig)).toThrow('Payload expired or outside clock-skew window');
  });

  it('fails on replayed request ID', () => {
    const { payload, signature } = createTermuxPayload('SYS_MEM_CHECK');
    verifyTermuxPayload(payload, signature);
    expect(() => verifyTermuxPayload(payload, signature)).toThrow('Replayed request ID');
  });
});
