import { Navbar, type AvisoConRelaciones } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import type { UserProfile } from '@/types';

interface MainShellProps {
  children: React.ReactNode;
  profile?: UserProfile | null;
  horasSemana?: number;
  updateAvatarAction?: (formData: FormData) => Promise<void>;
  avisosPendientes?: AvisoConRelaciones[];
}

export function MainShell({ children, profile, horasSemana = 0, updateAvatarAction, avisosPendientes }: MainShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar profile={profile ?? null} updateAvatarAction={updateAvatarAction} avisosPendientes={avisosPendientes} />
      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-6 lg:py-8">
        <Sidebar horasSemana={horasSemana} isAdmin={profile?.rol === 'administrador'} />
        <main className="space-y-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
