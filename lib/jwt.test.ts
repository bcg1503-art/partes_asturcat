import { describe, expect, it } from 'vitest';
import { isAccessTokenExpired } from './jwt';

function makeToken(payload: Record<string, unknown>) {
  const base64url = (input: string) => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('isAccessTokenExpired', () => {
  it('returns false for a token whose exp is in the future', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isAccessTokenExpired(token)).toBe(false);
  });

  it('returns true for a token whose exp is in the past', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isAccessTokenExpired(token)).toBe(true);
  });

  it('returns false when the token has no exp claim', () => {
    const token = makeToken({ sub: 'user-id' });
    expect(isAccessTokenExpired(token)).toBe(false);
  });

  it('treats a malformed token as expired (fail-safe)', () => {
    expect(isAccessTokenExpired('not-a-real-jwt')).toBe(true);
  });

  it('treats an empty string as expired', () => {
    expect(isAccessTokenExpired('')).toBe(true);
  });
});
