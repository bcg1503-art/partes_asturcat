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

    const { data: user } = await supabase.from('users').select('id').limit(1).single();
    // prefer default seeded cliente if present
    const clienteId = '00000000-0000-0000-0000-000000000001';

    if (!user) {
      return NextResponse.json({ error: 'Missing user' }, { status: 400 });
    }

    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const mes = now.getUTCMonth() + 1;
    const ano = now.getUTCFullYear();

    const { data: parte, error: parteError } = await supabase
      .from('partes')
      .upsert(
        { trabajador_id: user.id, cliente_id: clienteId, mes, ano },
        { onConflict: 'trabajador_id,cliente_id,mes,ano', ignoreDuplicates: false }
      )
      .select('*')
      .single();

    if (parteError) return NextResponse.json({ error: parteError.message }, { status: 500 });

    const { data: registro, error: registroError } = await supabase
      .from('registros_parte')
      .insert({
        parte_id: parte.id,
        fecha,
        horas: 8,
        observaciones: 'Creado en local'
      })
      .select('*')
      .single();

    if (registroError) return NextResponse.json({ error: registroError.message }, { status: 500 });

    return NextResponse.json({ ok: true, parte, registro });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
