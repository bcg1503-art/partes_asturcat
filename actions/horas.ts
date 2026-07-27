import { supabaseServer } from '@/lib/supabase-server';
import { formatWeekLabel, getWeekStart, toDateString } from '@/lib/weeks';

export interface HistorialSemana {
  weekStart: string;
  label: string;
  totalHoras: number;
  porCliente: Array<{ clienteId: string; clienteNombre: string; horas: number }>;
}

const WEEKS_TO_SHOW = 8;

interface ParteConCliente {
  fecha: string;
  horas: number;
  cliente_id: string;
  clientes: { nombre: string } | null;
}

export async function getHistorialSemanalTrabajador(trabajadorId: string): Promise<HistorialSemana[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('partes')
    .select('fecha, horas, cliente_id, clientes(nombre)')
    .eq('trabajador_id', trabajadorId)
    .order('fecha', { ascending: false });
  if (error) throw error;

  const weeks = new Map<string, HistorialSemana>();

  for (const parte of (data ?? []) as unknown as ParteConCliente[]) {
    const weekStartDate = getWeekStart(parte.fecha);
    const weekStart = toDateString(weekStartDate);
    const clienteNombre = parte.clientes?.nombre ?? 'N/A';

    let week = weeks.get(weekStart);
    if (!week) {
      week = { weekStart, label: formatWeekLabel(weekStartDate), totalHoras: 0, porCliente: [] };
      weeks.set(weekStart, week);
    }

    week.totalHoras += Number(parte.horas);
    const clienteEntry = week.porCliente.find((c) => c.clienteId === parte.cliente_id);
    if (clienteEntry) {
      clienteEntry.horas += Number(parte.horas);
    } else {
      week.porCliente.push({ clienteId: parte.cliente_id, clienteNombre, horas: Number(parte.horas) });
    }
  }

  return Array.from(weeks.values())
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
    .slice(0, WEEKS_TO_SHOW);
}

export interface TrabajadorHoras {
  trabajadorId: string;
  trabajadorNombre: string;
  trabajadorAvatarUrl: string | null;
  totalHoras: number;
  porCliente: Array<{ clienteId: string; clienteNombre: string; horas: number }>;
}

interface ParteConClienteYTrabajador {
  cliente_id: string;
  trabajador_id: string;
  horas: number;
  clientes: { nombre: string } | null;
  users: { id: string; nombre: string; avatar_url: string | null } | null;
}

export async function getHorasPorTrabajadorYCliente(): Promise<TrabajadorHoras[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('partes')
    .select('cliente_id, trabajador_id, horas, clientes(nombre), users(id,nombre,avatar_url)')
    .order('fecha', { ascending: false });
  if (error) throw error;

  const trabajadores = new Map<string, TrabajadorHoras>();

  for (const parte of (data ?? []) as unknown as ParteConClienteYTrabajador[]) {
    const clienteNombre = parte.clientes?.nombre ?? 'N/A';
    const trabajadorNombre = parte.users?.nombre ?? 'N/A';
    const trabajadorAvatarUrl = parte.users?.avatar_url ?? null;

    let trabajador = trabajadores.get(parte.trabajador_id);
    if (!trabajador) {
      trabajador = { trabajadorId: parte.trabajador_id, trabajadorNombre, trabajadorAvatarUrl, totalHoras: 0, porCliente: [] };
      trabajadores.set(parte.trabajador_id, trabajador);
    }

    trabajador.totalHoras += Number(parte.horas);
    const clienteEntry = trabajador.porCliente.find((c) => c.clienteId === parte.cliente_id);
    if (clienteEntry) {
      clienteEntry.horas += Number(parte.horas);
    } else {
      trabajador.porCliente.push({ clienteId: parte.cliente_id, clienteNombre, horas: Number(parte.horas) });
    }
  }

  return Array.from(trabajadores.values()).sort((a, b) => a.trabajadorNombre.localeCompare(b.trabajadorNombre));
}
