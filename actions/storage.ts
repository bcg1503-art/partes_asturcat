import { supabaseServer } from '@/lib/supabase-server';

const PARTES_BUCKET = 'partes';

function publicUrl(filePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PARTES_BUCKET}/${filePath}`;
}

export async function uploadFirma(userId: string, firmaDataUrl: string) {
  const blob = await fetch(firmaDataUrl).then((res) => res.blob());
  const filePath = `firmas/${userId}-${Date.now()}.png`;
  const supabase = await supabaseServer();
  const { error } = await supabase.storage.from(PARTES_BUCKET).upload(filePath, blob, {
    contentType: 'image/png',
    upsert: false
  });

  if (error) throw error;
  return publicUrl(filePath);
}

export async function uploadFotoParte(parteId: string, file: File) {
  const filePath = `fotos/${parteId}/${Date.now()}-${file.name}`;
  const supabase = await supabaseServer();
  const { error } = await supabase.storage.from(PARTES_BUCKET).upload(filePath, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) throw error;
  return publicUrl(filePath);
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
