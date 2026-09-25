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
 * Gets the parte header for a given trabajador+cliente+mes+ano combination,
 * creating it (with a fresh numero_parte) if it doesn't exist yet.
 *
 * Uses `insert ... on conflict do nothing` against the
 * unique(trabajador_id, cliente_id, mes, ano) constraint so this is safe even
 * if two requests for the same combination race each other: only one insert
 * wins, the other falls through to the select below.
 */
async function getOrCreateParte(trabajadorId: string, clienteId: string, mes: number, ano: number): Promise<Parte> {
  const supabase = await supabaseServer();

  const { data: inserted, error: insertError } = await supabase
    .from('partes')
    .insert([{ trabajador_id: trabajadorId, cliente_id: clienteId, mes, ano }])
    .select('*')
    .maybeSingle();

  if (insertError && insertError.code !== '23505') {
    throw insertError;
  }

  if (inserted) {
    return inserted;
  }

  const { data: existing, error: selectError } = await supabase
    .from('partes')
    .select('*')
    .eq('trabajador_id', trabajadorId)
    .eq('cliente_id', clienteId)
    .eq('mes', mes)
    .eq('ano', ano)
    .single();

  if (selectError || !existing) {
    throw selectError ?? new Error('No se pudo crear ni recuperar el parte.');
  }

  return existing;
}

export function parseParteFormData(formData: FormData) {
  return {
    fecha: formData.get('fecha')?.toString() ?? '',
    cliente_id: formData.get('cliente_id')?.toString() ?? '',
    horas: Number(formData.get('horas')?.toString() ?? '0'),
    observaciones: formData.get('observaciones')?.toString().trim() || null
  };
}

/**
 * Adds a work day (registro) for the trabajador. Finds or creates the parte
 * header for the trabajador+cliente+mes/ano combination implied by `fecha`,
 * then appends a new registro row to it — it never overwrites a previous
 * registro for the same parte.
 */
export async function createRegistroParte(usuarioId: string, formData: FormData) {
  const values = parseParteFormData(formData);
  if (!values.fecha || !values.cliente_id) {
    throw new Error('Fecha y cliente son obligatorios.');
  }

  const { mes, ano } = extractMesAno(values.fecha);
  const parte = await getOrCreateParte(usuarioId, values.cliente_id, mes, ano);

  const supabase = await supabaseServer();

  if (parte.estado !== 'pendiente') {
    // Adding a new day to a parte the admin had already reviewed reopens it,
    // so the admin sees it needs a fresh look.
    const { error: reopenError } = await supabase.from('partes').update({ estado: 'pendiente' }).eq('id', parte.id);
    if (reopenError) throw reopenError;
    parte.estado = 'pendiente';
  }

  const { data: registro, error } = await supabase
    .from('registros_parte')
    .insert([
      {
        parte_id: parte.id,
        fecha: values.fecha,
        horas: values.horas,
        observaciones: values.observaciones
      }
    ])
    .select('*')
    .single();

  if (error) throw error;
  return { parte, registro };
}

/**
 * Updates a single registro (day entry). The registro must keep the same
 * mes/ano as its parent parte — moving a date to a different month means it
 * belongs to a different parte, which isn't supported as an edit.
 */
export async function updateRegistroParte(registroId: string, usuarioId: string, formData: FormData) {
  const values = parseParteFormData(formData);
  if (!values.fecha) {
    throw new Error('La fecha es obligatoria.');
  }

  const supabase = await supabaseServer();
  const { data: registro, error: fetchError } = await supabase
    .from('registros_parte')
    .select('*, partes!inner(id, trabajador_id, mes, ano, estado)')
    .eq('id', registroId)
    .single();

  if (fetchError || !registro) {
    throw new Error('Registro no encontrado.');
  }

  const parte = registro.partes as { id: string; trabajador_id: string; mes: number; ano: number; estado: string };

  if (parte.trabajador_id !== usuarioId) {
    throw new Error('No puedes editar este registro.');
  }

  const { mes, ano } = extractMesAno(values.fecha);
  if (mes !== parte.mes || ano !== parte.ano) {
    throw new Error('No puedes cambiar la fecha a un mes distinto del parte. Crea un nuevo registro para ese mes.');
  }

  if (parte.estado !== 'pendiente') {
    // Editing a day on a parte the admin had already reviewed reopens it, so
    // the admin sees it needs a fresh look.
    const { error: reopenError } = await supabase.from('partes').update({ estado: 'pendiente' }).eq('id', parte.id);
    if (reopenError) throw reopenError;
  }

  const { error: updateError } = await supabase
    .from('registros_parte')
    .update({
      fecha: values.fecha,
      horas: values.horas,
      observaciones: values.observaciones
    })
    .eq('id', registroId);

  if (updateError) throw updateError;
}

export async function markParteRevisado(id: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('partes').update({ estado: 'revisado' }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

/**
 * Bulk-closes every pendiente parte for a given mes/ano (admin only, enforced
 * both by the caller and by the "administrador manage all partes" RLS
 * policy). Returns how many partes were closed.
 */
export async function cerrarMes(mes: number, ano: number) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('partes')
    .update({ estado: 'revisado' })
    .eq('mes', mes)
    .eq('ano', ano)
    .eq('estado', 'pendiente')
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Bulk-closes every pendiente parte, regardless of mes/ano (admin only,
 * enforced both by the caller and by the "administrador manage all partes"
 * RLS policy). Returns how many partes were closed.
 */
export async function validarTodosLosPartes() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('partes')
    .update({ estado: 'revisado' })
    .eq('estado', 'pendiente')
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}
