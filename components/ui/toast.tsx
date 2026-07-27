'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ToastProps {
  open: boolean;
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

export function Toast({ open, message, variant = 'info', onClose }: ToastProps) {
  const Icon = iconMap[variant];

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex w-[min(380px,calc(100%-2rem))] items-center gap-3 rounded-3xl border px-4 py-4 shadow-card',
            variant === 'success' && 'border-success-200/80 bg-white text-success-800 dark:border-success-500/40 dark:bg-slate-900',
            variant === 'error' && 'border-danger-200/80 bg-white text-danger-800 dark:border-danger-500/40 dark:bg-slate-900',
            variant === 'info' && 'border-brand-200/80 bg-white text-brand-800 dark:border-brand-500/40 dark:bg-slate-900'
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm leading-6">{message}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
