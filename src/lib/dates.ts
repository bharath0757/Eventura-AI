const calendarFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const updatedAtFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Date-only arithmetic uses UTC internally; never parse a date-only string as a local timestamp. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1000 || y > 9999) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
export function todayLocal(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
export function addDays(value: string, days: number): string {
  if (!isCalendarDate(value) || !Number.isInteger(days))
    throw new Error("Invalid calendar date or day offset.");
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
export function daysBetween(start: string, end: string): number {
  const toMs = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toMs(end) - toMs(start)) / 86400000);
}
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return calendarFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}
export const money = (value: number) => currencyFormatter.format(value);

export const formatUpdatedAt = (value: string) => updatedAtFormatter.format(new Date(value));
