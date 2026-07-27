import { supabase } from '@/lib/supabase-client';
import type { Cliente } from '@/types';

export async function fetchClientes() {
  const { data, error } = await supabase.from('clientes').select('*').order('nombre');
  if (error) throw error;
  return data;
}

export async function fetchClienteById(id: string) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
