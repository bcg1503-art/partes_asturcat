import { describe, expect, it } from 'vitest';
import { parseRecoveryParams } from './recovery';

describe('parseRecoveryParams', () => {
  it('reads the PKCE code from the query string', () => {
    const params = parseRecoveryParams('https://app.example/reset-password?code=abc123');

    expect(params.code).toBe('abc123');
    expect(params.tokenHash).toBeNull();
    expect(params.type).toBeNull();
  });

  it('reads legacy hash-based recovery tokens', () => {
    const params = parseRecoveryParams(
      'https://app.example/reset-password#access_token=token-123&refresh_token=refresh-456&type=recovery'
    );

    expect(params.accessToken).toBe('token-123');
    expect(params.refreshToken).toBe('refresh-456');
    expect(params.type).toBe('recovery');
  });

  it('reads token_hash recovery links from Supabase email templates', () => {
    const params = parseRecoveryParams('https://app.example/reset-password?token_hash=hash-xyz&type=recovery');

    expect(params.tokenHash).toBe('hash-xyz');
    expect(params.type).toBe('recovery');
  });
});
