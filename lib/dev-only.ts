import { NextResponse } from 'next/server';

// Guards the app/api/dev/** and dev-only auth routes: these use the service-role
// key with no auth check, so they must never respond in a deployed/production build.
export function devOnlyGuard() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  return null;
}
