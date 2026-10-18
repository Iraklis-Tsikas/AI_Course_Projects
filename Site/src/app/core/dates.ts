const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface YearMonth {
  y: number;
  m: number; // 1-12
}

export function parseYm(value: string | null, now = new Date()): YearMonth {
  if (!value) return { y: now.getFullYear(), m: now.getMonth() + 1 };
  const [y, m] = value.split('-').map(Number);
  return { y, m };
}

/** Inclusive month count, matching how LinkedIn reports durations. */
export function monthsBetween(start: string, end: string | null): number {
  const a = parseYm(start);
  const b = parseYm(end);
  return (b.y - a.y) * 12 + (b.m - a.m) + 1;
}

export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
  return parts.join(' ') || '1 mo';
}

export function formatYm(value: string | null): string {
  if (!value) return 'Present';
  const { y, m } = parseYm(value);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Fractional year, e.g. 2021-10 → 2021.75 (start of month). */
export function toYearFraction(value: string | null, endOfMonth = false): number {
  const { y, m } = parseYm(value);
  return y + (m - 1 + (endOfMonth ? 1 : 0)) / 12;
}

export function nowYearFraction(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return now.getFullYear() + (now.getTime() - start) / (end - start);
}
