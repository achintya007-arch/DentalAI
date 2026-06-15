// Validation helpers for appointment slots. The AI extracts a datetime from a
// free-text conversation; never trust it blindly. We refuse slots in the past
// or absurdly far in the future before creating an appointment.

const MIN_LEAD_MS = 15 * 60 * 1000; // must be at least 15 min from now
const MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000; // and within a year

// True if the string already carries an explicit timezone designator (Z or ±hh:mm).
function hasExplicitOffset(s: string): boolean {
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(s.trim());
}

// Offset (ms) of `timeZone` from UTC at the instant `date`. Positive = ahead of UTC.
function tzOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - date.getTime();
}

/**
 * Convert a naive wall-clock ISO string ("2026-06-15T16:00:00") that represents
 * local time in `timeZone` into the correct UTC Date. India has no DST so this
 * is exact; for DST zones it is accurate except within the ~1h transition window.
 */
export function zonedWallTimeToUtc(naiveISO: string, timeZone: string): Date {
  const naiveAsUtc = new Date(naiveISO + "Z"); // first read components as if UTC
  if (isNaN(naiveAsUtc.getTime())) return new Date(NaN);
  const offset = tzOffsetMs(timeZone, naiveAsUtc);
  return new Date(naiveAsUtc.getTime() - offset);
}

/**
 * Parse a slot. If `timeZone` is given and the string has no explicit offset, the
 * naive time is interpreted in that timezone (the clinic's). If the string already
 * carries an offset, it is trusted as-is.
 */
export function parseSlot(input: string | null | undefined, timeZone?: string): Date | null {
  if (!input) return null;
  const s = input.trim();
  const d = !timeZone || hasExplicitOffset(s) ? new Date(s) : zonedWallTimeToUtc(s, timeZone);
  return isNaN(d.getTime()) ? null : d;
}

/** True if `date` is a sane future appointment slot. */
export function isValidFutureSlot(date: Date, now = new Date()): boolean {
  const t = date.getTime();
  return t >= now.getTime() + MIN_LEAD_MS && t <= now.getTime() + MAX_AHEAD_MS;
}
