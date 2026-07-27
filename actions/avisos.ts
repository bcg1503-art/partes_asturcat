import { supabaseServer } from '@/lib/supabase-server';

interface CreateAvisoParams {
  trabajadorId: string;
  clienteId: string;
  obraId?: string | null;
  nota?: string;
  creadoPor: string;
}

export async function createAviso(params: CreateAvisoParams) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('avisos')
    .insert({
      trabajador_id: params.trabajadorId,
      cliente_id: params.clienteId,
      obra_id: params.obraId ?? null,
      nota: params.nota ?? null,
      creado_por: params.creadoPor
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getAvisosPendientes(trabajadorId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('avisos')
    .select('*, clientes(id,nombre), obras(id,nombre)')
    .eq('trabajador_id', trabajadorId)
    .eq('resuelto', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllAvisos() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('avisos')
    .select('*, users!avisos_trabajador_id_fkey(id,nombre), clientes(id,nombre), obras(id,nombre)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function resolveAvisosForParte(trabajadorId: string, clienteId: string, obraId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from('avisos')
    .update({ resuelto: true })
    .eq('trabajador_id', trabajadorId)
    .eq('cliente_id', clienteId)
    .eq('resuelto', false)
    .or(`obra_id.is.null,obra_id.eq.${obraId}`);
  if (error) throw error;
}
