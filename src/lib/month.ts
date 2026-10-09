/** Months are "YYYY-MM" strings everywhere in the app (URL `?luna=2026-09`). */

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/** A valid month from the URL, or null. */
export function parseMonth(value: unknown): string | null {
  return typeof value === "string" && MONTH_RE.test(value) && value >= "2000-01" ? value : null;
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** First and last day of the month, as YYYY-MM-DD. */
export function monthRange(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(last).padStart(2, "0")}`];
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** "2026-09" → "Septembrie 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const name = MONTH_NAMES[m - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

/** "2026-09" → "septembrie 2026", for use inside a sentence. */
export function monthLabelLower(month: string): string {
  return monthLabel(month).toLowerCase();
}

/**
 * A date to prefill in a form for the chosen month: today if the month is
 * the current one, otherwise the month's last day (or first, for the future).
 */
export function defaultDateIn(month: string, today: string): string {
  const [from, to] = monthRange(month);
  if (today >= from && today <= to) return today;
  return today > to ? to : from;
}
