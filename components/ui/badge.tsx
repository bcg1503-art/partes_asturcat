import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  info: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em]', variantStyles[variant], className)} {...props} />
  );
}
