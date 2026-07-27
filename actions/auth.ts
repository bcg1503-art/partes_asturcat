import { supabaseServer } from '@/lib/supabase-server';
import { uploadAvatar } from '@/actions/storage';
import type { UserProfile } from '@/types';

export async function getCurrentUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return null;
  }

  const user = data.session.user;

  const { data: profile, error } = await supabase
    .from('users')
    .select('id,nombre,email,rol,avatar_url')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return {
      id: user.id,
      nombre: user.user_metadata?.name ?? user.email ?? 'Usuario',
      email: user.email ?? '',
      rol: 'trabajador',
      avatar_url: null
    };
  }

  return profile as UserProfile;
}

export async function signOutAction() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
}

export async function getTrabajadores() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('users').select('id,nombre,email').eq('rol', 'trabajador').order('nombre');
  if (error) throw error;
  return data;
}

export async function updateUserAvatar(userId: string, file: File) {
  const avatarUrl = await uploadAvatar(userId, file);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId).select('id').single();
  if (error || !data) throw error ?? new Error('No se pudo actualizar el avatar.');
  return avatarUrl;
}
