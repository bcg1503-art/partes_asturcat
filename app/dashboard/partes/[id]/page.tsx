import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';
import { formatNumeroPartee } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import type { RegistroParte } from '@/types';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

async function markParteRevisadoAction(parteId: string) {
  'use server';

  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('Sesión inválida.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .single();

  if (profileError || profile?.rol !== 'administrador') {
    throw new Error('No tienes permisos para marcar este parte como revisado.');
  }

  const { error } = await supabase.from('partes').update({ estado: 'revisado' }).eq('id', parteId);
  if (error) throw error;
}

interface ParteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ParteDetailPage({ params }: ParteDetailPageProps) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) {
    notFound();
  }

  const supabase = await supabaseServer();
  const { data: parte, error } = await supabase
    .from('partes')
    .select('*, users(id,nombre,avatar_url), clientes(id,nombre), registros_parte(*)')
    .eq('id', id)
    .single();

  if (error || !parte) {
    notFound();
  }

  if (profile.rol === 'trabajador' && parte.trabajador_id !== profile.id) {
    notFound();
  }

  const registros = ((parte.registros_parte ?? []) as RegistroParte[])
    .slice()
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const horasTotales = registros.reduce((sum, registro) => sum + Number(registro.horas), 0);
  const puedeEditar = parte.trabajador_id === profile.id;

  async function handleMarkRevisado() {
    'use server';
    await markParteRevisadoAction(parte.id);
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Detalle del parte</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Parte <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-lg font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">{formatNumeroPartee(parte.numero_parte)}</span></h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile.rol === 'administrador' && parte.estado === 'pendiente' ? (
              <form action={handleMarkRevisado}>
                <button type="submit" className="inline-flex items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Marcar como revisado
                </button>
              </form>
            ) : null}
            {puedeEditar ? (
              <Link
                href={`/dashboard/partes/nuevo?cliente_id=${parte.cliente_id}`}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Añadir registro
              </Link>
            ) : null}
            <Link
              href="/dashboard/partes"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Volver
            </Link>
          </div>
        </div>

        <div className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Trabajador</p>
              <div className="mt-2 flex items-center gap-3">
                {parte.users?.nombre ? <Avatar nombre={parte.users.nombre} avatarUrl={parte.users.avatar_url} size="sm" /> : null}
                <p className="text-base font-medium text-slate-900 dark:text-slate-100">{parte.users?.nombre}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cliente</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">{parte.clientes?.nombre}</p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Periodo</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">{MESES[parte.mes - 1] ?? parte.mes} {parte.ano}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Estado</p>
              <Badge variant={parte.estado === 'pendiente' ? 'warning' : 'success'}>{parte.estado}</Badge>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Registros</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total: {horasTotales} h</p>
            </div>
            {registros.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Este parte todavía no tiene registros.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Horas</th>
                      <th className="px-4 py-3">Observaciones</th>
                      {puedeEditar ? <th className="px-4 py-3">Acción</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((registro) => (
                      <tr key={registro.id} className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                        <td className="px-4 py-3">{new Date(registro.fecha).toLocaleDateString('es-ES')}</td>
                        <td className="px-4 py-3">{registro.horas}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{registro.observaciones || '—'}</td>
                        {puedeEditar ? (
                          <td className="px-4 py-3">
                            <Link
                              className="text-brand-600 underline decoration-brand-200 transition hover:text-brand-700 dark:text-brand-300"
                              href={`/dashboard/partes/${parte.id}/registros/${registro.id}/editar`}
                            >
                              Editar
                            </Link>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </section>
  );
}
