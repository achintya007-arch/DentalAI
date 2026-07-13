import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------------
// Double-booking guard. A slot conflicts if an active (REQUESTED/CONFIRMED)
// appointment for the same clinic already exists within ±CONFLICT_WINDOW_MIN.
// Simple by design — real per-dentist calendars are a post-revenue feature.
// ----------------------------------------------------------------------------

export const CONFLICT_WINDOW_MIN = 30;

/** Pure helper: the [from, to] range a slot must have to itself. */
export function conflictRange(slot: Date, windowMin = CONFLICT_WINDOW_MIN): { from: Date; to: Date } {
  return {
    from: new Date(slot.getTime() - windowMin * 60 * 1000),
    to: new Date(slot.getTime() + windowMin * 60 * 1000),
  };
}

/** True if the clinic already has an active appointment within the window. */
export async function hasConflict(
  clinicId: string,
  slot: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const { from, to } = conflictRange(slot);
  const count = await prisma.appointment.count({
    where: {
      clinicId,
      scheduledAt: { gte: from, lte: to },
      status: { in: ["REQUESTED", "CONFIRMED"] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  });
  return count > 0;
}
