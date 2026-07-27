export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm font-medium">Cargando…</span>
      </div>
    </div>
  );
}
