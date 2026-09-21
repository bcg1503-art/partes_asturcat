import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ParteForm } from '@/components/partes/parte-form';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';
import { createParteConAdjuntos } from '@/actions/partes';

interface NewPartePageProps {
  searchParams: Promise<{ cliente_id?: string }>;
}

export default async function NewPartePage({ searchParams }: NewPartePageProps) {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }

  const { cliente_id: preselectedClienteId } = await searchParams;

  const supabase = await supabaseServer();
  const { data: clientes, error: clientesError } = await supabase.from('clientes').select('*').order('nombre');

  if (clientesError) {
    throw clientesError;
  }

  async function createParteAction(formData: FormData) {
    'use server';

    const supabase = await supabaseServer();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      redirect('/signin');
    }

    await createParteConAdjuntos(sessionData.session.user.id, formData);
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Nuevo parte</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Crear parte de trabajo</h1>
        </div>
        <Link
          href="/dashboard/partes"
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          Volver al listado
        </Link>
      </div>
      <ParteForm
        clientes={clientes ?? []}
        defaultValues={{ cliente_id: preselectedClienteId }}
        action={createParteAction}
        submitLabel="Guardar parte"
      />
    </section>
  );
}
