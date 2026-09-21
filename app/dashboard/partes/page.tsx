import Link from 'next/link';
import { ParteTable } from '@/components/partes/parte-table';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';

const PAGE_SIZE = 20;

interface PartesPageProps {
  searchParams: Promise<{ page?: string }>;
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
    .select('*, users(id,nombre,avatar_url), clientes(id,nombre)', { count: 'exact' })
    .order('fecha', { ascending: false })
    .range(from, to);

  if (profile.rol === 'trabajador') {
    query.eq('trabajador_id', profile.id);
  }

  const { data: partes, error, count } = await query;
  if (error) {
    throw error;
  }

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Partes de trabajo</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Tus partes recientes</h1>
        </div>
        <Link href="/dashboard/partes/nuevo" className="inline-flex items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
          Nuevo parte
        </Link>
      </div>
      <ParteTable partes={partes ?? []} isAdmin={profile.rol === 'administrador'} />
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
