import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';
import { formatNumeroPartee } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

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
    .select('*, users(id,nombre,avatar_url), clientes(id,nombre)')
    .eq('id', id)
    .single();

  if (error || !parte) {
    notFound();
  }

  if (profile.rol === 'trabajador' && parte.trabajador_id !== profile.id) {
    notFound();
  }

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
            {profile.rol === 'administrador' ? (
              <form action={handleMarkRevisado}>
                <button type="submit" className="inline-flex items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Marcar como revisado
                </button>
              </form>
            ) : null}
            {parte.estado === 'pendiente' && parte.trabajador_id === profile.id ? (
              <Link
                href={`/dashboard/partes/${parte.id}/editar`}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Editar parte
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

        <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
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
              <p className="text-sm text-slate-500 dark:text-slate-400">Fecha</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">{new Date(parte.fecha).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Horas</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">{parte.horas}</p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Mes / Año</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">{parte.mes}/{parte.ano}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Estado</p>
              <Badge variant={parte.estado === 'pendiente' ? 'warning' : 'success'}>{parte.estado}</Badge>
            </div>
          </div>
          {parte.observaciones && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Observaciones</p>
              <p className="mt-2 text-base text-slate-700 dark:text-slate-200">{parte.observaciones}</p>
            </div>
          )}
        </div>
    </section>
  );
}
