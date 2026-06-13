// Validation helpers for appointment slots. The AI extracts a datetime from a
// free-text conversation; never trust it blindly. We refuse slots in the past
// or absurdly far in the future before creating an appointment.

const MIN_LEAD_MS = 15 * 60 * 1000; // must be at least 15 min from now
const MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000; // and within a year

export function parseSlot(input: string | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/** True if `date` is a sane future appointment slot. */
export function isValidFutureSlot(date: Date, now = new Date()): boolean {
  const t = date.getTime();
  return t >= now.getTime() + MIN_LEAD_MS && t <= now.getTime() + MAX_AHEAD_MS;
}
