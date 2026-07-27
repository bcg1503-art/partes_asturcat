import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { devOnlyGuard } from '@/lib/dev-only';

export async function GET() {
  const guard = devOnlyGuard();
  if (guard) return guard;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const email = 'testuser+cp@example.com';
    const password = 'P4ssword!';

    // Create auth user via admin
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    } as any);

    if (createError) {
      // If user exists, ignore error
      if (!createError.message.includes('already exists')) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    }

    // Ensure profile exists in `users` table
    const { data: profileData, error: profileError } = await supabase.from('users').upsert({
      id: userData?.user?.id ?? undefined,
      nombre: 'Usuario Test',
      email,
      rol: 'trabajador',
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email, password });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
