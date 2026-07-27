// All arithmetic stays in UTC on purpose: `fecha` columns are plain YYYY-MM-DD
// dates with no time/timezone component, and mixing local-time getters/setters
// with toISOString() (UTC) shifts the date by a day depending on server timezone.

export function getWeekStart(dateInput: string | Date): Date {
  const date = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00Z`) : new Date(dateInput);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setUTCDate(weekStart.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart);
  const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}
