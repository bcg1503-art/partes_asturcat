import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'default' && 'bg-brand-600 text-white shadow-[0_18px_45px_rgba(20,184,166,0.14)] hover:bg-brand-700',
        variant === 'outline' && 'border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
        variant === 'destructive' && 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
        className
      )}
      {...props}
    />
  );
}
