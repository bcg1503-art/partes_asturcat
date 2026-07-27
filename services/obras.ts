import { supabase } from '@/lib/supabase-client';
import type { Obra } from '@/types';

export async function fetchObras() {
  const { data, error } = await supabase.from('obras').select('*').order('nombre');
  if (error) throw error;
  return data;
}

export async function fetchObraById(id: string) {
  const { data, error } = await supabase.from('obras').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
