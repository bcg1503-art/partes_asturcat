export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
