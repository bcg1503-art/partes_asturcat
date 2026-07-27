import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, email, rol } = body;
    if (!id || !email || !nombre || !rol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('users').insert({ id, nombre, email, rol });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
