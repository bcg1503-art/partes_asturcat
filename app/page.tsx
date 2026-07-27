import Link from 'next/link';
import { ArrowRight, ShieldCheck, ClipboardList, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section className="space-y-8">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                Plataforma SaaS para partes de obra
              </span>
              <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Controla tus partes de trabajo con confianza y claridad</h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Un dashboard limpio y profesional para trabajadores y administradores. Registra partes, gestiona clientes, supervisa obras y acelera la operación diaria.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signin">
                <Button className="min-w-[10rem]">Iniciar sesión</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="min-w-[10rem]">Crear cuenta</Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
                <div className="flex items-center gap-3 text-brand-600 dark:text-brand-300">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-semibold">Seguridad y permisos</p>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Autenticación robusta y roles claros para cada usuario.</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
                <div className="flex items-center gap-3 text-brand-600 dark:text-brand-300">
                  <ClipboardList className="h-5 w-5" />
                  <p className="text-sm font-semibold">Partes ágiles</p>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Crea y revisa partes con una experiencia organizada y rápida.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-8 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Dashboard</p>
              <div className="mt-6 space-y-5">
                {[
                  { label: 'Partes en tiempo real', value: '24/7', icon: ArrowRight },
                  { label: 'Control de clientes', value: 'Gestión centralizada', icon: Users }
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                      </div>
                      <Icon className="h-6 w-6 text-brand-600 dark:text-brand-300" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-brand-600/10 p-6 shadow-soft backdrop-blur dark:border-brand-500/20 dark:bg-brand-500/15">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700 dark:text-brand-200">Lanzamiento</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Haz que tu equipo trabaje con menor fricción</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Centraliza proyectos, partes y firmas digitales en una experiencia diseñada para construcción y mantenimiento.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
