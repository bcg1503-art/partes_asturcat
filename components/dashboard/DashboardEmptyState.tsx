import { ArrowUpRight, BarChart3, ClipboardList, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ChartCard } from '@/components/charts/ChartCard';
import { ProgresoChart } from '@/components/dashboard/ProgresoChart';
import { Avatar } from '@/components/ui/avatar';
import { HistorialSemanalCard } from '@/components/dashboard/HistorialSemanalCard';
import type { HistorialSemana } from '@/actions/horas';

interface DashboardEmptyStateProps {
  nombre: string;
  avatarUrl?: string | null;
  partesCount: number;
  clientesCount: number;
  pendientesCount: number;
  revisadosCount: number;
  historialSemanal?: HistorialSemana[];
}

export function DashboardEmptyState({
  nombre,
  avatarUrl,
  partesCount,
  clientesCount,
  pendientesCount,
  revisadosCount,
  historialSemanal
}: DashboardEmptyStateProps) {
  const avancePct = partesCount > 0 ? Math.round((revisadosCount / partesCount) * 100) : 0;
  const firstName = nombre.trim().split(/\s+/)[0] ?? nombre;
  const subtitle =
    pendientesCount > 0
      ? `Tienes ${pendientesCount} parte${pendientesCount === 1 ? '' : 's'} pendiente${pendientesCount === 1 ? '' : 's'} por ser aprobado${pendientesCount === 1 ? '' : 's'}.`
      : 'Todo al día, no tienes partes pendientes.';

  return (
    <div className="space-y-10">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-6">
            <Avatar nombre={nombre} avatarUrl={avatarUrl} size="xl" />
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Hola, {firstName}</h2>
              <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
        </Card>

        <ChartCard title="Progreso" description="Partes revisados frente al total">
          <ProgresoChart pendientes={pendientesCount} revisados={revisadosCount} />
        </ChartCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Partes', value: String(partesCount), icon: ClipboardList },
          { label: 'Clientes', value: String(clientesCount), icon: Users },
          { label: 'Tareas', value: '0', icon: BarChart3 },
          { label: 'Avance', value: `${avancePct}%`, icon: ArrowUpRight }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="rounded-[1.75rem] border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-slate-100">{item.value}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {historialSemanal ? <HistorialSemanalCard historial={historialSemanal} /> : null}
    </div>
  );
}
