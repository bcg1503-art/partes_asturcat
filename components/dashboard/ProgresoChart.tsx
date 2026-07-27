interface ProgresoChartProps {
  pendientes: number;
  revisados: number;
}

export function ProgresoChart({ pendientes, revisados }: ProgresoChartProps) {
  const total = pendientes + revisados;

  if (total === 0) {
    return (
      <div className="grid h-32 place-items-center rounded-3xl bg-slate-100 text-center text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <p className="text-sm">Todavía no hay partes para mostrar el progreso.</p>
      </div>
    );
  }

  const revisadosPct = Math.round((revisados / total) * 100);
  const pendientesPct = 100 - revisadosPct;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-semibold text-slate-900 dark:text-slate-100">{revisadosPct}%</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">de los partes revisados</p>
      </div>

      <div
        className="flex h-5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="img"
        aria-label={`${revisados} partes revisados, ${pendientes} pendientes (${revisadosPct}% completado)`}
      >
        {revisados > 0 ? <div className="h-full bg-emerald-500 dark:bg-emerald-600" style={{ width: `${revisadosPct}%` }} /> : null}
        {revisados > 0 && pendientes > 0 ? <div className="h-full w-0.5 bg-slate-50 dark:bg-slate-950" /> : null}
        {pendientes > 0 ? <div className="h-full bg-amber-500 dark:bg-amber-600" style={{ width: `${pendientesPct}%` }} /> : null}
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-600" />
          Revisados <span className="font-semibold text-slate-900 dark:text-slate-100">{revisados}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 dark:bg-amber-600" />
          Pendientes <span className="font-semibold text-slate-900 dark:text-slate-100">{pendientes}</span>
        </span>
      </div>
    </div>
  );
}
