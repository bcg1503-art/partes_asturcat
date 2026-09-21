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

    const { data: users } = await supabase.from('users').select('*').limit(10);
    const { data: clientes } = await supabase.from('clientes').select('*').limit(10);
    const { data: obras } = await supabase.from('obras').select('*').limit(10);
    const { data: partes } = await supabase.from('partes').select('*').limit(10).order('id', { ascending: false });
    const { data: registrosParte } = await supabase.from('registros_parte').select('*').limit(10).order('id', { ascending: false });

    return NextResponse.json({ ok: true, users, clientes, obras, partes, registrosParte });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
