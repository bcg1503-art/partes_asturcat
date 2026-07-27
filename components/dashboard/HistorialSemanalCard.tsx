import { Card } from '@/components/ui/card';
import type { HistorialSemana } from '@/actions/horas';

interface HistorialSemanalCardProps {
  historial: HistorialSemana[];
}

export function HistorialSemanalCard({ historial }: HistorialSemanalCardProps) {
  if (historial.length === 0) {
    return null;
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Historial semanal por cliente</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Tus horas de cada semana agrupadas por cliente. No se borra al empezar una semana nueva.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {historial.map((week) => (
          <div key={week.weekStart} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{week.label}</p>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-300">{week.totalHoras}h</p>
            </div>
            <div className="mt-2 space-y-1">
              {week.porCliente.map((cliente) => (
                <div key={cliente.clienteId} className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span className="truncate">{cliente.clienteNombre}</span>
                  <span className="flex-none">{cliente.horas}h</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
