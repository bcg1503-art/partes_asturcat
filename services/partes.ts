import { supabase } from '@/lib/supabase-client';

export async function fetchPartesForTrabajador(trabajadorId: string) {
  const { data, error } = await supabase
    .from('partes')
    .select('*, clientes(id,nombre), registros_parte(*)')
    .eq('trabajador_id', trabajadorId)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchAllPartes() {
  const { data, error } = await supabase
    .from('partes')
    .select('*, users(id,nombre,avatar_url), clientes(id,nombre), registros_parte(*)')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchParteById(parteId: string) {
  const { data, error } = await supabase
    .from('partes')
    .select('*, users(id,nombre,avatar_url), clientes(id,nombre), registros_parte(*)')
    .eq('id', parteId)
    .single();

  if (error) throw error;
  return data;
}
