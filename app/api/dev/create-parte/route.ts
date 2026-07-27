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
    // prefer default seeded clientes/obras if present
    const clienteId = '00000000-0000-0000-0000-000000000001';
    const obraId = '10000000-0000-0000-0000-000000000001';

    if (!user) {
      return NextResponse.json({ error: 'Missing user' }, { status: 400 });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const { data: parte, error } = await supabase
      .from('partes')
      .insert({
        trabajador_id: user.id,
        cliente_id: clienteId,
        obra_id: obraId,
        fecha,
        horas: 8,
        descripcion: 'Parte de prueba creado por dev API',
        materiales: 'Ninguno',
        observaciones: 'Creado en local'
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, parte });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
