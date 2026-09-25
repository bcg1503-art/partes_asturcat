import Link from 'next/link';
import { ArrowUpRight, ClipboardList, Users } from 'lucide-react';
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
    <div className="space-y-6 sm:space-y-10">
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-6">
            <Avatar nombre={nombre} avatarUrl={avatarUrl} size="xl" />
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">Hola, {firstName}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">{subtitle}</p>
            </div>
          </div>
        </Card>

        <ChartCard title="Progreso" description="Partes revisados frente al total">
          <ProgresoChart pendientes={pendientesCount} revisados={revisadosCount} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Partes', value: String(partesCount), icon: ClipboardList, href: '/dashboard/partes' },
          { label: 'Clientes', value: String(clientesCount), icon: Users, href: '/dashboard/clientes' },
          { label: 'Avance', value: `${avancePct}%`, icon: ArrowUpRight, href: null }
        ].map((item) => {
          const Icon = item.icon;
          const cardContent = (
            <Card className="rounded-[1rem] border-slate-200 bg-white/95 p-3 shadow-soft transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 sm:rounded-[1.5rem] sm:p-5 xl:p-6">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:text-xs">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100 sm:mt-3 sm:text-3xl">{item.value}</p>
                </div>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:h-12 sm:w-12">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </Card>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="block">
                {cardContent}
              </Link>
            );
          }

          return <div key={item.label}>{cardContent}</div>;
        })}
      </div>

      {historialSemanal ? <HistorialSemanalCard historial={historialSemanal} /> : null}
    </div>
  );
}
