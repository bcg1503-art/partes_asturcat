import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { getCurrentUserProfile } from '@/actions/auth';
import { getClientes } from '@/actions/clientes';
import { getHistorialSemanalTrabajador } from '@/actions/horas';
import { supabaseServer } from '@/lib/supabase-server';

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return null;
  }

  const supabase = await supabaseServer();

  const partesQuery = supabase.from('partes').select('*', { count: 'exact', head: true });
  const revisadosQuery = supabase.from('partes').select('*', { count: 'exact', head: true }).eq('estado', 'revisado');
  if (profile.rol === 'trabajador') {
    partesQuery.eq('trabajador_id', profile.id);
    revisadosQuery.eq('trabajador_id', profile.id);
  }

  const [{ count: partesCount }, { count: revisadosCount }, clientes] = await Promise.all([
    partesQuery,
    revisadosQuery,
    getClientes()
  ]);

  const historialSemanal = profile.rol === 'trabajador' ? await getHistorialSemanalTrabajador(profile.id) : undefined;

  return (
    <DashboardEmptyState
      nombre={profile.nombre}
      avatarUrl={profile.avatar_url}
      partesCount={partesCount ?? 0}
      clientesCount={clientes.length}
      revisadosCount={revisadosCount ?? 0}
      pendientesCount={(partesCount ?? 0) - (revisadosCount ?? 0)}
      historialSemanal={historialSemanal}
    />
  );
}
