import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ParteForm } from '@/components/partes/parte-form';
import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserProfile } from '@/actions/auth';
import { updateRegistroParte } from '@/actions/partes';
import { formatNumeroPartee } from '@/lib/utils';

interface EditRegistroPageProps {
  params: Promise<{ id: string; registroId: string }>;
}

export default async function EditRegistroPage({ params }: EditRegistroPageProps) {
  const { id, registroId } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }

  const supabase = await supabaseServer();
  const { data: registro, error: registroError } = await supabase
    .from('registros_parte')
    .select('*, partes!inner(id, trabajador_id, estado, cliente_id, clientes(id,nombre), numero_parte)')
    .eq('id', registroId)
    .eq('parte_id', id)
    .single();

  if (registroError || !registro) {
    notFound();
  }

  const parte = registro.partes as {
    id: string;
    trabajador_id: string;
    estado: string;
    cliente_id: string;
    clientes: { id: string; nombre: string } | null;
    numero_parte: number;
  };

  if (profile.rol === 'trabajador' && parte.trabajador_id !== profile.id) {
    notFound();
  }

  async function updateRegistroAction(formData: FormData) {
    'use server';

    const supabase = await supabaseServer();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      redirect('/signin');
    }

    const usuarioId = sessionData.session.user.id;
    if (usuarioId !== parte.trabajador_id && profile?.rol !== 'administrador') {
      throw new Error('No puedes editar este registro.');
    }

    await updateRegistroParte(registroId, usuarioId, formData);
    redirect(`/dashboard/partes/${id}`);
  }

  const defaultValues = {
    fecha: registro.fecha,
    cliente_id: parte.cliente_id,
    horas: String(registro.horas),
    observaciones: registro.observaciones ?? ''
  };

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Editar registro</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Parte {formatNumeroPartee(parte.numero_parte)}</h1>
        </div>
        <Link
          href={`/dashboard/partes/${id}`}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          Volver al detalle
        </Link>
      </div>
      <ParteForm
        clientes={[]}
        clienteFijo={{ id: parte.cliente_id, nombre: parte.clientes?.nombre ?? 'Cliente' }}
        numeroPartee={formatNumeroPartee(parte.numero_parte)}
        defaultValues={defaultValues}
        action={updateRegistroAction}
        submitLabel="Actualizar registro"
      />
    </section>
  );
}
