'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    async function init() {
      // PKCE-style recovery links use a `?code=` query param instead of the
      // implicit `#access_token=` hash fragment, and need an explicit exchange.
      const code = new URL(window.location.href).searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          setReady(true);
          return;
        }
        setError('El enlace no es válido o ha caducado. Solicita uno nuevo.');
        return;
      }

      const result: { data: { session: unknown } } = await supabase.auth.getSession();
      if (result.data.session) setReady(true);
    }

    init();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // The recovery flow leaves an active client-side session (in localStorage) that
    // never went through the server cookie bridge (/api/auth/set-session). Sign out
    // here so /signin doesn't bounce the user to /dashboard without valid cookies.
    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.replace('/signin'), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white/95 p-10 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Acceso al sistema</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Crea una nueva contraseña</h1>
          </div>

          {!ready ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error ?? 'Verificando el enlace...'} Si has llegado aquí sin pasar por el email de recuperación, vuelve a{' '}
              <a href="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
                solicitar el enlace
              </a>
              .
            </p>
          ) : success ? (
            <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              Contraseña actualizada. Te llevamos a iniciar sesión...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nueva contraseña</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar contraseña</label>
                <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </div>

              {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
