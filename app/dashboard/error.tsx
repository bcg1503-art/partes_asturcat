'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white/95 p-10 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ha ocurrido un error</p>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        {error.message || 'No se ha podido cargar esta página. Inténtalo de nuevo.'}
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
