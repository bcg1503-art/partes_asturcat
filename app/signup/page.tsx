'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpUser } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const data = await signUpUser(email, password, nombre, 'trabajador');
      if (data.session) {
        setSuccess('Registro completado. Redirigiendo al dashboard...');
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        setSuccess('Registro completado. Revisa tu correo y confirma tu cuenta antes de iniciar sesión.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error en el registro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-6 rounded-[1.25rem] border border-slate-200 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90 sm:rounded-[1.75rem] sm:p-10">
          <div className="space-y-2">
            <img src="/branding/asturcat-logo.png" alt="Asturcat" className="mb-2 h-10 w-10 rounded-lg" />
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Asturcat Construcciones</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Crear cuenta</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Regístrate como trabajador para empezar a registrar tus partes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre completo</label>
              <Input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>
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
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar contraseña</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrar'}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/signin" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
