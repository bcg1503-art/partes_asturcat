import { beforeEach, describe, expect, it, vi } from 'vitest';

const { supabaseServer } = vi.hoisted(() => ({
  supabaseServer: vi.fn()
}));

vi.mock('@/lib/supabase-server', () => ({ supabaseServer }));

import { getCurrentUserProfile } from './auth';

function mockClient({
  session,
  profile,
  profileError
}: {
  session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null;
  profile?: { id: string; nombre: string; email: string; rol: string } | null;
  profileError?: unknown;
}) {
  supabaseServer.mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: profile ?? null, error: profileError ?? null })
        })
      })
    })
  });
}

describe('getCurrentUserProfile', () => {
  beforeEach(() => {
    supabaseServer.mockReset();
  });

  it('returns null when there is no active session', async () => {
    mockClient({ session: null });

    const profile = await getCurrentUserProfile();

    expect(profile).toBeNull();
  });

  it('returns the real role from the users table (regression: used to be hardcoded to "trabajador")', async () => {
    mockClient({
      session: { user: { id: 'user-1', email: 'admin@example.com' } },
      profile: { id: 'user-1', nombre: 'Ana Admin', email: 'admin@example.com', rol: 'administrador' }
    });

    const profile = await getCurrentUserProfile();

    expect(profile).toEqual({ id: 'user-1', nombre: 'Ana Admin', email: 'admin@example.com', rol: 'administrador' });
  });

  it('falls back to "trabajador" when the profile row is missing', async () => {
    mockClient({
      session: { user: { id: 'user-2', email: 'nuevo@example.com', user_metadata: { name: 'Nuevo Trabajador' } } },
      profile: null,
      profileError: { message: 'no rows' }
    });

    const profile = await getCurrentUserProfile();

    expect(profile).toEqual({
      id: 'user-2',
      nombre: 'Nuevo Trabajador',
      email: 'nuevo@example.com',
      rol: 'trabajador',
      avatar_url: null
    });
  });
});
