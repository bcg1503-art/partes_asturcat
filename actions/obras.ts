import { supabaseServer } from '@/lib/supabase-server';
import type { Obra } from '@/types';

export async function getObras() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('obras').select('*, clientes(id,nombre)').order('nombre');
  if (error) throw error;
  return data as Array<Obra & { clientes: { id: string; nombre: string } | null }>;
}

export async function createObra(nombre: string, clienteId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('obras').insert({ nombre, cliente_id: clienteId }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateObra(id: string, nombre: string, clienteId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('obras')
    .update({ nombre, cliente_id: clienteId })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteObra(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from('obras').delete().eq('id', id);
  if (error) throw error;
}
