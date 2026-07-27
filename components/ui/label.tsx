import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('block text-sm font-medium text-slate-700 dark:text-slate-300', className)} {...props} />;
}
