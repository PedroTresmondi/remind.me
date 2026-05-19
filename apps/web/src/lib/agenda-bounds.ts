/** Limites do dia local (meia-noite → 23:59:59.999) para filtros de agenda. */

export function getTodayBounds() {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday);
  endToday.setHours(23, 59, 59, 999);
  return { startToday, endToday, now };
}

/** Data/hora estritamente depois de hoje (a partir de amanhã 00:00). */
export function isScheduledAfterToday(iso: string): boolean {
  const { endToday } = getTodayBounds();
  return new Date(iso) > endToday;
}

/** Dentro de hoje (inclusive). */
export function isScheduledToday(iso: string): boolean {
  const { startToday, endToday } = getTodayBounds();
  const d = new Date(iso);
  return d >= startToday && d <= endToday;
}

export function isScheduledBeforeToday(iso: string): boolean {
  const { startToday } = getTodayBounds();
  return new Date(iso) < startToday;
}
