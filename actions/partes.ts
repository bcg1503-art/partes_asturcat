import { supabaseServer } from '@/lib/supabase-server';
import { uploadFirma, uploadFotoParte } from '@/actions/storage';
import { resolveAvisosForParte } from '@/actions/avisos';
import type { Parte } from '@/types';

export async function createParte(parte: Omit<Parte, 'id' | 'created_at' | 'estado'>) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('partes').insert(parte).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateParte(id: string, values: Partial<Omit<Parte, 'id' | 'trabajador_id' | 'created_at'>>) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('partes').update(values).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function markParteRevisado(id: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('partes').update({ estado: 'revisado' }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteParte(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from('partes').delete().eq('id', id);
  if (error) throw error;
}

export function parseParteFormData(formData: FormData) {
  return {
    fecha: formData.get('fecha')?.toString() ?? '',
    cliente_id: formData.get('cliente_id')?.toString() ?? '',
    obra_id: formData.get('obra_id')?.toString() ?? '',
    horas: Number(formData.get('horas')?.toString() ?? '0'),
    descripcion: formData.get('descripcion')?.toString() ?? '',
    materiales: formData.get('materiales')?.toString() ?? '',
    observaciones: formData.get('observaciones')?.toString() ?? ''
  };
}

async function attachParteUploads(parteId: string, usuarioId: string, formData: FormData) {
  const firma = formData.get('firma');
  if (typeof firma === 'string' && firma.length > 0) {
    const firmaUrl = await uploadFirma(usuarioId, firma);
    await updateParte(parteId, { firma_url: firmaUrl });
  }

  const fotos = formData.getAll('fotos');
  for (const file of fotos) {
    if (!(file instanceof File)) continue;
    const fotoUrl = await uploadFotoParte(parteId, file);
    const supabase = await supabaseServer();
    const { error } = await supabase.from('fotosparte').insert({ parte_id: parteId, foto_url: fotoUrl });
    if (error) throw error;
  }
}

export async function createParteConAdjuntos(usuarioId: string, formData: FormData) {
  const values = parseParteFormData(formData);
  const parte = await createParte({ ...values, trabajador_id: usuarioId });
  await attachParteUploads(parte.id, usuarioId, formData);
  await resolveAvisosForParte(usuarioId, values.cliente_id, values.obra_id);
  return parte;
}

export async function updateParteConAdjuntos(parteId: string, usuarioId: string, formData: FormData) {
  const values = parseParteFormData(formData);
  await updateParte(parteId, values);
  await attachParteUploads(parteId, usuarioId, formData);
}
