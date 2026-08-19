import { encrypt, decrypt } from '../src/vault/crypto';

describe('Vault Cryptography', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'b'.repeat(64);
  });

  it('encrypts and decrypts correctly', () => {
    const plaintext = 'super-secret-api-key';
    const { ciphertext, iv, authTag } = encrypt(plaintext);
    
    expect(ciphertext).not.toBe(plaintext);
    expect(iv.length).toBe(24);
    expect(authTag.length).toBe(32);

    const decrypted = decrypt(ciphertext, iv, authTag);
    expect(decrypted).toBe(plaintext);
  });

  it('produces unique IVs', () => {
    const e1 = encrypt('test');
    const e2 = encrypt('test');
    expect(e1.iv).not.toBe(e2.iv);
  });

  it('fails decryption if ciphertext modified', () => {
    const { ciphertext, iv, authTag } = encrypt('test');
    const badCipher = ciphertext.replace(/a/g, 'b');
    if (badCipher !== ciphertext) {
      expect(() => decrypt(badCipher, iv, authTag)).toThrow();
    }
  });

  it('fails decryption if authTag modified', () => {
    const { ciphertext, iv, authTag } = encrypt('test');
    const badTag = authTag.replace(/[0-9a-f]/, 'f');
    if (badTag !== authTag) {
      expect(() => decrypt(ciphertext, iv, badTag)).toThrow();
    }
  });
});
