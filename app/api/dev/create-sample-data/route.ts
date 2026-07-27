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

    // Insert sample cliente and obra
    const { data: cliente, error: clienteError } = await supabase.from('clientes').insert({ nombre: 'Cliente Demo' }).select('*').maybeSingle();
    if (clienteError) return NextResponse.json({ error: clienteError.message }, { status: 500 });

    const { data: obra, error: obraError } = await supabase.from('obras').insert({ nombre: 'Obra Demo' }).select('*').maybeSingle();
    if (obraError) return NextResponse.json({ error: obraError.message }, { status: 500 });

    return NextResponse.json({ ok: true, cliente, obra });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
