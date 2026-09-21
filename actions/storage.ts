import { supabaseServer } from '@/lib/supabase-server';

const PARTES_BUCKET = 'partes';

function publicUrl(filePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PARTES_BUCKET}/${filePath}`;
}

export async function uploadAvatar(userId: string, file: File) {
  const extension = file.name.split('.').pop() || 'jpg';
  const filePath = `avatars/${userId}-${Date.now()}.${extension}`;
  const supabase = await supabaseServer();
  const { error } = await supabase.storage.from(PARTES_BUCKET).upload(filePath, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) throw error;
  return publicUrl(filePath);
}
