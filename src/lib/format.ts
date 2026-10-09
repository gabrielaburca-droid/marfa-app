const ron = new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" });
const number = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 6 });
const date = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const dateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

/** Display only. Amounts arrive from Postgres already rounded to 2 decimals. */
export function formatRON(value: number | string | null | undefined): string {
  return value === null || value === undefined ? "–" : ron.format(Number(value));
}

export function formatMoney(value: number | string, currency: string): string {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency }).format(Number(value));
}

export function formatNumber(value: number | string): string {
  return number.format(Number(value));
}

/** "2026-10-10" → "10.10.2026" */
export function formatDate(iso: string): string {
  return date.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** Today's date in Romania as YYYY-MM-DD. */
export function todayRO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(now);
}

/** "Bună dimineața" / "Bună ziua" / "Bună seara", by the time in Romania. */
export function greetingRO(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Bucharest" }).format(
      now,
    ),
  );
  if (hour >= 5 && hour < 12) return "Bună dimineața";
  if (hour >= 12 && hour < 18) return "Bună ziua";
  return "Bună seara";
}

/** "joi, 9 octombrie" */
export function longDateRO(now = new Date()): string {
  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Bucharest",
  }).format(now);
}
