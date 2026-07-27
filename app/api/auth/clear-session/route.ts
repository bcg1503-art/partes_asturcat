import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    maxAge: 0,
  });

  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    maxAge: 0,
  });

  return response;
}
