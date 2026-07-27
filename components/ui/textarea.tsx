import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'min-h-[140px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-brand-400 dark:focus:ring-brand-900/20',
        className
      )}
      {...props}
    />
  );
}
