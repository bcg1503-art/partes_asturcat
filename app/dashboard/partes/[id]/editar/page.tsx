import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ParteForm } from '@/components/partes/parte-form';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';
import { updateParteConAdjuntos } from '@/actions/partes';
import { formatNumeroPartee } from '@/lib/utils';

interface EditPartePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPartePage({ params }: EditPartePageProps) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }

  const supabase = await supabaseServer();
  const { data: parte, error: parteError } = await supabase
    .from('partes')
    .select('*')
    .eq('id', id)
    .single();

  if (parteError || !parte) {
    notFound();
  }

  if (profile?.rol === 'trabajador' && parte.trabajador_id !== profile.id) {
    notFound();
  }

  if (parte.estado !== 'pendiente') {
    redirect(`/dashboard/partes/${id}`);
  }

  const { data: clientes, error: clientesError } = await supabase.from('clientes').select('*').order('nombre');

  if (clientesError) {
    throw clientesError;
  }

  async function updateParteAction(formData: FormData) {
    'use server';

    const supabase = await supabaseServer();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      redirect('/signin');
    }

    const usuarioId = sessionData.session.user.id;
    if (usuarioId !== parte.trabajador_id && profile?.rol !== 'administrador') {
      throw new Error('No puedes editar este parte.');
    }

    await updateParteConAdjuntos(id, usuarioId, formData);
  }

  const defaultValues = {
    fecha: parte.fecha,
    cliente_id: parte.cliente_id,
    horas: String(parte.horas),
    observaciones: parte.observaciones ?? ''
  };

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Editar parte</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Actualizar parte</h1>
        </div>
        <Link
          href={`/dashboard/partes/${id}`}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          Volver al detalle
        </Link>
      </div>
      <ParteForm
        clientes={clientes}
        numeroPartee={formatNumeroPartee(parte.numero_parte)}
        defaultValues={defaultValues}
        action={updateParteAction}
        submitLabel="Actualizar parte"
      />
    </section>
  );
}
