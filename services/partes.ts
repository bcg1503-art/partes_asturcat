import { supabase } from '@/lib/supabase-client';
import type { Parte } from '@/types';

export async function fetchPartesForTrabajador(trabajadorId: string) {
  const { data, error } = await supabase
    .from('partes')
    .select('*')
    .eq('trabajador_id', trabajadorId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchAllPartes() {
  const { data, error } = await supabase
    .from('partes')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchParteById(parteId: string) {
  const { data, error } = await supabase
    .from('partes')
    .select('*')
    .eq('id', parteId)
    .single();

  if (error) throw error;
  return data;
}
