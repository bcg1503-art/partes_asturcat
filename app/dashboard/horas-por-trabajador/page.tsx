import { redirect } from 'next/navigation';
import { TableShell } from '@/components/tables/TableShell';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { getCurrentUserProfile } from '@/actions/auth';
import { getHorasPorTrabajadorYCliente } from '@/actions/horas';

export default async function HorasPorTrabajadorPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect('/signin');
  }
  if (profile.rol !== 'administrador') {
    redirect('/dashboard');
  }

  const trabajadores = await getHorasPorTrabajadorYCliente();

  return (
    <TableShell title="Horas por trabajador" description="Horas que ha dedicado cada trabajador a cada cliente.">
      {trabajadores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          Todavía no hay partes registrados.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trabajadores.map((trabajador) => (
            <Card key={trabajador.trabajadorId} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar nombre={trabajador.trabajadorNombre} avatarUrl={trabajador.trabajadorAvatarUrl} size="sm" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{trabajador.trabajadorNombre}</h3>
                </div>
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">{trabajador.totalHoras}h</span>
              </div>
              <div className="mt-3 space-y-2">
                {trabajador.porCliente
                  .sort((a, b) => b.horas - a.horas)
                  .map((cliente) => (
                    <div
                      key={cliente.clienteId}
                      className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-900"
                    >
                      <span className="text-slate-700 dark:text-slate-200">{cliente.clienteNombre}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{cliente.horas}h</span>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </TableShell>
  );
}
