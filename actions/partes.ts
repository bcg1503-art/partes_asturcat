import { supabaseServer } from '@/lib/supabase-server';
import type { Parte } from '@/types';

/**
 * Extracts mes (1-12) and ano from a date string (YYYY-MM-DD)
 */
function extractMesAno(fecha: string): { mes: number; ano: number } {
  const date = new Date(fecha + 'T00:00:00Z');
  return {
    mes: date.getUTCMonth() + 1,
    ano: date.getUTCFullYear()
  };
}

/**
 * Gets or creates a parte number for a given trabajador+cliente+mes+ano combination.
 * Returns the numero_parte (integer).
 * 
 * If a parte already exists for this combination, returns its numero_parte.
 * If it does not exist, creates a new reference with a new numero_parte.
 */
async function getOrCreateParteNumber(
  trabajadorId: string,
  clienteId: string,
  mes: number,
  ano: number
): Promise<number> {
  const supabase = await supabaseServer();

  // Try to find existing reference
  const { data: existingRef, error: refError } = await supabase
    .from('parte_ref_trabajador_cliente_mes')
    .select('numero_parte')
    .eq('trabajador_id', trabajadorId)
    .eq('cliente_id', clienteId)
    .eq('mes', mes)
    .eq('ano', ano)
    .single();

  if (!refError && existingRef) {
    // Part already exists, return its numero_parte
    return existingRef.numero_parte;
  }

  // Create new part with auto-incrementing numero_parte
  const { data: newParte, error: parteError } = await supabase
    .from('partes')
    .insert([
      {
        trabajador_id: trabajadorId,
        cliente_id: clienteId,
        mes,
        ano,
        fecha: new Date().toISOString().split('T')[0], // Current date as placeholder
        horas: 0,
        estado: 'pendiente'
      }
    ])
    .select('numero_parte')
    .single();

  if (parteError || !newParte) {
    throw new Error(`Failed to create parte: ${parteError?.message ?? 'Unknown error'}`);
  }

  // Insert reference to prevent duplicates
  const { error: refInsertError } = await supabase
    .from('parte_ref_trabajador_cliente_mes')
    .insert([
      {
        trabajador_id: trabajadorId,
        cliente_id: clienteId,
        mes,
        ano,
        numero_parte: newParte.numero_parte
      }
    ]);

  if (refInsertError) {
    // If reference insert fails, it might be a race condition (concurrent creation)
    // Try fetching again
    const { data: retryRef } = await supabase
      .from('parte_ref_trabajador_cliente_mes')
      .select('numero_parte')
      .eq('trabajador_id', trabajadorId)
      .eq('cliente_id', clienteId)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();

    if (retryRef) {
      return retryRef.numero_parte;
    }
    throw refInsertError;
  }

  return newParte.numero_parte;
}

export async function updateParte(
  id: string,
  values: Partial<Omit<Parte, 'id' | 'trabajador_id' | 'numero_parte' | 'created_at'>>
) {
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
    horas: Number(formData.get('horas')?.toString() ?? '0'),
    observaciones: formData.get('observaciones')?.toString() ?? ''
  };
}

export async function createParteConAdjuntos(usuarioId: string, formData: FormData) {
  const values = parseParteFormData(formData);
  const { mes, ano } = extractMesAno(values.fecha);

  // Get or create parte number for this combination
  const numeroPartee = await getOrCreateParteNumber(usuarioId, values.cliente_id, mes, ano);

  // Insert or update the actual registro
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from('partes')
    .select('id')
    .eq('numero_parte', numeroPartee)
    .eq('trabajador_id', usuarioId)
    .single();

  if (existing) {
    // If this is the first entry for this parte, update it
    const { data: parte, error } = await supabase
      .from('partes')
      .update({
        fecha: values.fecha,
        horas: values.horas,
        observaciones: values.observaciones
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return parte;
  }

  const { data: parte, error } = await supabase
    .from('partes')
    .insert([
      {
        numero_parte: numeroPartee,
        trabajador_id: usuarioId,
        cliente_id: values.cliente_id,
        fecha: values.fecha,
        horas: values.horas,
        mes,
        ano,
        observaciones: values.observaciones,
        estado: 'pendiente'
      }
    ])
    .select('*')
    .single();

  if (error) throw error;
  return parte;
}

export async function updateParteConAdjuntos(parteId: string, usuarioId: string, formData: FormData) {
  const values = parseParteFormData(formData);

  // Fetch current parte to verify it exists and belongs to user
  const supabase = await supabaseServer();
  const { data: currentParte, error: fetchError } = await supabase
    .from('partes')
    .select('numero_parte, trabajador_id, mes, ano')
    .eq('id', parteId)
    .single();

  if (fetchError || !currentParte) {
    throw new Error('Parte not found');
  }

  if (currentParte.trabajador_id !== usuarioId) {
    throw new Error('Unauthorized');
  }

  // Verify fecha still has same mes+ano (cannot change part)
  const { mes, ano } = extractMesAno(values.fecha);
  if (mes !== currentParte.mes || ano !== currentParte.ano) {
    throw new Error('Cannot change the month/year of a parte. Create a new parte for a different month.');
  }

  // Update only fecha, horas, observaciones (not numero_parte, fecha derivados)
  const { error: updateError } = await supabase
    .from('partes')
    .update({
      fecha: values.fecha,
      horas: values.horas,
      observaciones: values.observaciones
    })
    .eq('id', parteId);

  if (updateError) throw updateError;
}
