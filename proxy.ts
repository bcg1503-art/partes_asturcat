import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAccessTokenExpired } from '@/lib/jwt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

async function refreshSession(refreshToken: string): Promise<RefreshedTokens | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.access_token || !data.refresh_token) return null;

    return { accessToken: data.access_token, refreshToken: data.refresh_token };
  } catch {
    return null;
  }
}

function setAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  const secure = process.env.NODE_ENV === 'production';

  // No maxAge: session cookies, cleared when the browser closes.
  response.cookies.set('sb-access-token', tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure
  });

  response.cookies.set('sb-refresh-token', tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure
  });
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set('sb-access-token', '', { path: '/', maxAge: 0 });
  response.cookies.set('sb-refresh-token', '', { path: '/', maxAge: 0 });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  let isAuthenticated = Boolean(accessToken) && !isAccessTokenExpired(accessToken!);
  let refreshedTokens: RefreshedTokens | null = null;
  let refreshFailed = false;

  if (!isAuthenticated && refreshToken) {
    refreshedTokens = await refreshSession(refreshToken);
    if (refreshedTokens) {
      // Propagate the refreshed tokens to this same request so downstream
      // Server Components/Actions don't read the stale (already-rotated) cookie.
      request.cookies.set('sb-access-token', refreshedTokens.accessToken);
      request.cookies.set('sb-refresh-token', refreshedTokens.refreshToken);
      isAuthenticated = true;
    } else {
      refreshFailed = true;
    }
  }

  let response: NextResponse;

  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    response = NextResponse.redirect(new URL('/signin', request.url));
  } else if (pathname === '/signin' && isAuthenticated) {
    response = NextResponse.redirect(new URL('/dashboard', request.url));
  } else {
    response = NextResponse.next({ request });
  }

  if (refreshedTokens) {
    setAuthCookies(response, refreshedTokens);
  } else if (refreshFailed) {
    clearAuthCookies(response);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin']
};
