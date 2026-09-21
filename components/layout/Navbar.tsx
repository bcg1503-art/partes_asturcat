'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, Camera, LogOut, Moon, SunMedium, Menu, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { useClientMounted } from '@/hooks/use-client-mounted';
import { supabase } from '@/lib/supabase-client';
import type { UserProfile } from '@/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/partes', label: 'Partes' },
  { href: '/dashboard/clientes', label: 'Clientes' }
];

const AVATAR_SIZE = 256;

async function resizeImageToSquareJpeg(file: File, size = AVATAR_SIZE): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      img.src = objectUrl;
    });

    const side = Math.min(image.width, image.height);
    const sx = (image.width - side) / 2;
    const sy = (image.height - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', 0.85);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export interface AvisoConRelaciones {
  id: string;
  nota?: string | null;
  cliente_id: string;
  obra_id?: string | null;
  clientes?: { nombre: string } | null;
  obras?: { nombre: string } | null;
}

interface NavbarProps {
  profile?: UserProfile | null;
  updateAvatarAction?: (formData: FormData) => Promise<void>;
  avisosPendientes?: AvisoConRelaciones[];
}

export function Navbar({ profile, updateAvatarAction, avisosPendientes = [] }: NavbarProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useClientMounted();
  const isDark = mounted && resolvedTheme === 'dark';
  const [signingOut, setSigningOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const mobileNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/partes', label: 'Partes' },
    { href: '/dashboard/clientes', label: 'Clientes' },
    { href: '/dashboard/obras', label: 'Obras' },
    { href: '/dashboard/avisos', label: 'Avisos' },
    { href: '/dashboard/horas-por-trabajador', label: 'Horas' }
  ];
  const mobileQuickActions = [
    { href: '/dashboard/partes', label: 'Partes' },
    { href: '/dashboard/clientes', label: 'Clientes' },
    { href: '/dashboard/horas-por-trabajador', label: 'Tareas' }
  ];
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    await fetch('/api/auth/clear-session');
    router.replace('/signin');
    router.refresh();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !updateAvatarAction) return;

    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const resized = await resizeImageToSquareJpeg(file);
      const formData = new FormData();
      formData.append('avatar', resized, 'avatar.jpg');
      await updateAvatarAction(formData);
      router.refresh();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'No se pudo subir la foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
              className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-brand-600/10 text-brand-600 transition hover:bg-brand-600/20 dark:bg-brand-500/20 dark:text-brand-200 dark:hover:bg-brand-500/30"
            >
              {profile ? <Avatar nombre={profile.nombre} avatarUrl={profile.avatar_url} size="md" /> : <Menu className="h-5 w-5" />}
            </button>

            {profileOpen && profile ? (
              <div className="absolute left-0 top-full z-50 mt-3 w-72 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar nombre={profile.nombre} avatarUrl={profile.avatar_url} size="lg" />
                    {updateAvatarAction ? (
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        aria-label="Cambiar foto de perfil"
                        className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{profile.nombre}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
                  </div>
                </div>

                {uploadingAvatar ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Subiendo foto...</p> : null}
                {avatarError ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{avatarError}</p> : null}

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Rol</span>
                  <Badge variant={profile.rol === 'administrador' ? 'info' : 'default'}>{profile.rol}</Badge>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  <LogOut className="h-4 w-4" /> {signingOut ? 'Saliendo...' : 'Cerrar sesión'}
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              setMobileMenuOpen((current) => !current);
            }}
            aria-label="Abrir menú de navegación"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            <span>Menú</span>
          </button>

          <Link href="/" className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Partes de Trabajo</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Gestión de obra profesional</p>
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {profile?.rol === 'trabajador' ? (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((current) => !current)}
                aria-haspopup="true"
                aria-expanded={notifOpen}
                aria-label="Avisos"
                className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Bell className="h-4 w-4" />
                {avisosPendientes.length > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-[11px] font-semibold text-white">
                    {avisosPendientes.length}
                  </span>
                ) : null}
              </button>

              {notifOpen ? (
                <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-950">
                  <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Avisos</p>
                  {avisosPendientes.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No tienes avisos pendientes.</p>
                  ) : (
                    <div className="space-y-3">
                      {avisosPendientes.map((aviso) => (
                        <div key={aviso.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {aviso.clientes?.nombre ?? 'Cliente'}
                            {aviso.obras?.nombre ? ` · ${aviso.obras.nombre}` : ''}
                          </p>
                          {aviso.nota ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{aviso.nota}</p> : null}
                          <Link
                            href={`/dashboard/partes/nuevo?cliente_id=${aviso.cliente_id}`}
                            onClick={() => setNotifOpen(false)}
                            className="mt-2 inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                          >
                            Crear parte →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          <Button variant="outline" onClick={toggleTheme} className="hidden sm:inline-flex">
            {mounted ? (
              isDark ? (
                <>
                  <SunMedium className="mr-2 h-4 w-4" /> Claro
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" /> Oscuro
                </>
              )
            ) : (
              'Tema'
            )}
          </Button>
          <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="hidden sm:inline-flex">
            <LogOut className="mr-2 h-4 w-4" /> {signingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/95 px-3 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="grid grid-cols-3 gap-2">
          {mobileQuickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950/95">
          <div className="space-y-2">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={async () => {
                setMobileMenuOpen(false);
                await handleSignOut();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/60"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? 'Saliendo...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
