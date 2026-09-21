import { revalidatePath } from 'next/cache';
import { MainShell } from '@/components/layout/MainShell';
import { getCurrentUserProfile, updateUserAvatar } from '@/actions/auth';
import { getAvisosPendientes } from '@/actions/avisos';
import { supabaseServer } from '@/lib/supabase-server';
import { getWeekEnd, getWeekStart, toDateString } from '@/lib/weeks';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserProfile();

  let horasSemana = 0;
  let avisosPendientes: Awaited<ReturnType<typeof getAvisosPendientes>> = [];

  if (profile) {
    const supabase = await supabaseServer();
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(weekStart);
    const horasQuery = supabase
      .from('registros_parte')
      .select('horas, partes!inner(trabajador_id)')
      .gte('fecha', toDateString(weekStart))
      .lte('fecha', toDateString(weekEnd));
    if (profile.rol === 'trabajador') {
      horasQuery.eq('partes.trabajador_id', profile.id);
    }
    const { data: registrosHoras } = await horasQuery;
    horasSemana = (registrosHoras ?? []).reduce((sum, registro) => sum + Number(registro.horas), 0);

    if (profile.rol === 'trabajador') {
      avisosPendientes = await getAvisosPendientes(profile.id);
    }
  }

  async function updateAvatarAction(formData: FormData) {
    'use server';

    const currentProfile = await getCurrentUserProfile();
    if (!currentProfile) {
      throw new Error('Sesión inválida.');
    }

    const file = formData.get('avatar');
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Selecciona una imagen.');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen.');
    }

    await updateUserAvatar(currentProfile.id, file);
    revalidatePath('/dashboard', 'layout');
  }

  return (
    <MainShell profile={profile} horasSemana={horasSemana} updateAvatarAction={updateAvatarAction} avisosPendientes={avisosPendientes}>
      {children}
    </MainShell>
  );
}
