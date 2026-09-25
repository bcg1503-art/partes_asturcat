interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[1.75rem] sm:p-6">
      <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}
