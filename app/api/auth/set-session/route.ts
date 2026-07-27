import { NextResponse } from 'next/server';

interface SessionPayload {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export async function POST(req: Request) {
  const body = await req.json();
  const session: SessionPayload = body?.session;

  if (!session?.access_token || !session?.refresh_token) {
    return NextResponse.json({ error: 'Session data is required' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production';

  // No maxAge: these are session cookies, cleared when the browser closes,
  // so the user has to sign in again next time instead of staying logged in.
  response.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
  });

  response.cookies.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
  });

  return response;
}
