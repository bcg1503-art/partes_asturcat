'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, FileText, LayoutDashboard, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/dashboard/partes', label: 'Partes', icon: FileText, adminOnly: false },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, adminOnly: false },
  { href: '/dashboard/avisos', label: 'Avisos', icon: Bell, adminOnly: true },
  { href: '/dashboard/horas-por-trabajador', label: 'Horas por trabajador', icon: BarChart3, adminOnly: true }
];

interface SidebarProps {
  horasSemana?: number;
  isAdmin?: boolean;
}

export function Sidebar({ horasSemana = 0, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950/90 lg:min-h-[calc(100vh-4rem)] lg:max-w-[18rem] lg:flex-none lg:p-6">
      <div className="mb-4 lg:mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Menú</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition lg:gap-3 lg:px-4 lg:py-3',
                  active
                    ? 'bg-brand-600 text-white shadow-brand/20 shadow-sm dark:bg-brand-500 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="mt-6 grid gap-4 lg:mt-10">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Horas esta semana</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600 dark:text-brand-300">{horasSemana}h</p>
        </div>

        <div className="space-y-2">
          <p className="px-1 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Accesos rápidos</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href="/dashboard/partes/nuevo"
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <Plus className="h-4 w-4" /> Nuevo parte
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard/clientes"
                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" /> Nuevo cliente
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
