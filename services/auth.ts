import { supabase } from '@/lib/supabase-client';
import type { UserProfile, UserRole } from '@/types';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpUser(email: string, password: string, nombre: string, rol: UserRole) {
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/signin` : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  if (error) throw error;

  if (!data.user) {
    throw new Error('No se pudo crear el usuario.');
  }

  const profile: Partial<UserProfile> = {
    id: data.user.id,
    nombre,
    email,
    rol
  };

  // Create the user profile via a secure server-side API that uses the service role key
  const resp = await fetch('/api/create-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!resp.ok) {
    const body = await resp.json();
    throw new Error(body?.error || 'Error creating profile');
  }

  if (data.session) {
    const sessionResponse = await fetch('/api/auth/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: data.session })
    });

    if (!sessionResponse.ok) {
      const body = await sessionResponse.json();
      throw new Error(body?.error || 'No se pudo guardar la sesión.');
    }
  }

  return data;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}
