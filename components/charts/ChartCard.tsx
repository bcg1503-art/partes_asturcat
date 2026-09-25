interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[1.75rem] sm:p-6">
      <div className="mb-4 flex flex-col gap-2">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
