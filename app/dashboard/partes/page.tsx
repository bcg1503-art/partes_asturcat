import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { ParteTable } from '@/components/partes/parte-table';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';
import { cerrarMes, markParteRevisado, validarTodosLosPartes } from '@/actions/partes';

const PAGE_SIZE = 20;
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface PartesPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function cerrarMesAction(formData: FormData) {
  'use server';

  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('Sesión inválida.');
  }

  const { data: profile } = await supabase.from('users').select('rol').eq('id', sessionData.session.user.id).single();
  if (profile?.rol !== 'administrador') {
    throw new Error('No tienes permisos para cerrar el mes.');
  }

  const mes = Number(formData.get('mes'));
  const ano = Number(formData.get('ano'));
  await cerrarMes(mes, ano);
  revalidatePath('/dashboard/partes');
}

async function validarTodosAction() {
  'use server';

  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('Sesión inválida.');
  }

  const { data: profile } = await supabase.from('users').select('rol').eq('id', sessionData.session.user.id).single();
  if (profile?.rol !== 'administrador') {
    throw new Error('No tienes permisos para validar partes.');
  }

  await validarTodosLosPartes();
  revalidatePath('/dashboard/partes');
}

async function validarParteAction(formData: FormData) {
  'use server';

  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    throw new Error('Sesión inválida.');
  }

  const { data: profile } = await supabase.from('users').select('rol').eq('id', sessionData.session.user.id).single();
  if (profile?.rol !== 'administrador') {
    throw new Error('No tienes permisos para validar partes.');
  }

  const parteId = formData.get('parteId')?.toString();
  if (!parteId) {
    throw new Error('Falta el parte a validar.');
  }

  await markParteRevisado(parteId);
  revalidatePath('/dashboard/partes');
}

export default async function PartesPage({ searchParams }: PartesPageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return null;
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await supabaseServer();
  const query = supabase
    .from('partes')
    .select('*, users(id,nombre,avatar_url), clientes(id,nombre), registros_parte(*)', { count: 'exact' })
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })
    .range(from, to);

  if (profile.rol === 'trabajador') {
    query.eq('trabajador_id', profile.id);
  }

  const { data: partes, error, count } = await query;
  if (error) {
    throw error;
  }

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  let meses: Array<{ mes: number; ano: number; total: number; pendientes: number }> = [];
  if (profile.rol === 'administrador') {
    const { data: todosLosPartes, error: mesesError } = await supabase.from('partes').select('mes, ano, estado');
    if (mesesError) throw mesesError;

    const grouped = new Map<string, { mes: number; ano: number; total: number; pendientes: number }>();
    for (const parte of todosLosPartes ?? []) {
      const key = `${parte.ano}-${parte.mes}`;
      const entry = grouped.get(key) ?? { mes: parte.mes, ano: parte.ano, total: 0, pendientes: 0 };
      entry.total += 1;
      if (parte.estado === 'pendiente') entry.pendientes += 1;
      grouped.set(key, entry);
    }
    meses = Array.from(grouped.values()).sort((a, b) => b.ano * 100 + b.mes - (a.ano * 100 + a.mes));
  }

  const totalPendientes = meses.reduce((sum, mesInfo) => sum + mesInfo.pendientes, 0);

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Partes de trabajo</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {profile.rol === 'trabajador' ? 'Mis partes' : 'Todos los partes'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profile.rol === 'administrador' && totalPendientes > 0 ? (
            <form action={validarTodosAction}>
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-brand-600 px-5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30"
              >
                Validar todos los partes
              </button>
            </form>
          ) : null}
          <Link href="/dashboard/partes/nuevo" className="inline-flex items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            Nuevo registro
          </Link>
        </div>
      </div>

      {profile.rol === 'administrador' && meses.length > 0 ? (
        <div className="mb-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Cierre mensual e informes</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {meses.map((mesInfo) => (
              <div key={`${mesInfo.ano}-${mesInfo.mes}`} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {MESES[mesInfo.mes - 1]} {mesInfo.ano}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {mesInfo.total} parte{mesInfo.total === 1 ? '' : 's'} · {mesInfo.pendientes} pendiente{mesInfo.pendientes === 1 ? '' : 's'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mesInfo.pendientes > 0 ? (
                    <form action={cerrarMesAction}>
                      <input type="hidden" name="mes" value={mesInfo.mes} />
                      <input type="hidden" name="ano" value={mesInfo.ano} />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                      >
                        Cerrar mes
                      </button>
                    </form>
                  ) : null}
                  <a
                    href={`/api/reports/parte-mensual?mes=${mesInfo.mes}&ano=${mesInfo.ano}`}
                    className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Descargar PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <ParteTable
        partes={partes ?? []}
        isAdmin={profile.rol === 'administrador'}
        groupByMonth={profile.rol === 'trabajador'}
        onValidar={profile.rol === 'administrador' ? validarParteAction : undefined}
      />
      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          {page > 1 ? (
            <Link
              href={`/dashboard/partes?page=${page - 1}`}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Anterior
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600">
              Anterior
            </span>
          )}
          <span>
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/dashboard/partes?page=${page + 1}`}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Siguiente
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600">
              Siguiente
            </span>
          )}
        </div>
      ) : null}
    </section>
  );
}
