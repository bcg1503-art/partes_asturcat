'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/dashboard');
      }
    }

    checkSession();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      const message = signInError.message.toLowerCase();
      if (message.includes('not confirmed') || message.includes('confirm')) {
        setError('La cuenta aún no está verificada. Revisa tu correo y confirma el enlace de activación.');
        return;
      }
      setError(signInError.message);
      return;
    }

    if (!data?.session) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
      return;
    }

    const sessionResponse = await fetch('/api/auth/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: data.session })
    });

    if (!sessionResponse.ok) {
      const body = await sessionResponse.json();
      setError(body?.error || 'No se pudo guardar la sesión.');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white/95 p-10 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
          <div className="space-y-2">
            <img src="/branding/asturcat-logo.png" alt="Asturcat" className="mb-2 h-10 w-10 rounded-lg" />
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Asturcat Construcciones</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Inicia sesión para continuar</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Registra y consulta los partes de trabajo del equipo.</p>
          </div>

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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
