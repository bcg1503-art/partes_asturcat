'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white/95 p-10 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Acceso al sistema</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Recupera tu contraseña</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Te enviaremos un enlace por email para que puedas crear una nueva contraseña.
            </p>
          </div>

          {sent ? (
            <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña. Revisa tu bandeja de
              entrada (y spam).
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>

              {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/signin" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
              Volver a inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
