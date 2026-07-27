import { supabaseServer } from '@/lib/supabase-server';
import type { Cliente } from '@/types';

export async function getClientes() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('clientes').select('*').order('nombre');
  if (error) throw error;
  return data as Cliente[];
}

export async function createCliente(nombre: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('clientes').insert({ nombre }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateCliente(id: string, nombre: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('clientes').update({ nombre }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteCliente(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}
