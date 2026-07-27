interface TableShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function TableShell({ title, description, children }: TableShellProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/95 shadow-soft dark:border-slate-800 dark:bg-slate-950/90">
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
