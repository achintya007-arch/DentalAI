import { prisma } from "@/lib/prisma";
import { FollowUpStage, ReminderKind } from "@prisma/client";

// ----------------------------------------------------------------------------
// Helpers that schedule the two automation types. They only create PENDING
// rows; the cron processor (src/lib/automations.ts) is what actually sends.
// ----------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Schedule the day-1 / day-3 / day-7 follow-ups for an un-booked lead. */
export async function scheduleFollowUps(clinicId: string, leadId: string, from = new Date()) {
  const stages: { stage: FollowUpStage; offset: number }[] = [
    { stage: "DAY_1", offset: 1 * DAY_MS },
    { stage: "DAY_3", offset: 3 * DAY_MS },
    { stage: "DAY_7", offset: 7 * DAY_MS },
  ];

  for (const { stage, offset } of stages) {
    await prisma.followUp.upsert({
      where: { leadId_stage: { leadId, stage } },
      update: {}, // never reschedule an already-created stage
      create: {
        clinicId,
        leadId,
        stage,
        scheduledFor: new Date(from.getTime() + offset),
      },
    });
  }
}

/** Cancel any still-pending follow-ups (called when a lead books). */
export async function cancelFollowUps(leadId: string) {
  await prisma.followUp.updateMany({
    where: { leadId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

/** Schedule the 24h and 2h reminders for a confirmed appointment. */
export async function scheduleReminders(clinicId: string, appointmentId: string, scheduledAt: Date) {
  const kinds: { kind: ReminderKind; before: number }[] = [
    { kind: "HOURS_24", before: 24 * HOUR_MS },
    { kind: "HOURS_2", before: 2 * HOUR_MS },
  ];

  for (const { kind, before } of kinds) {
    const scheduledFor = new Date(scheduledAt.getTime() - before);
    // Skip reminders that would already be in the past
    if (scheduledFor.getTime() <= Date.now()) continue;
    await prisma.reminder.upsert({
      where: { appointmentId_kind: { appointmentId, kind } },
      update: { scheduledFor, status: "PENDING" },
      create: { clinicId, appointmentId, kind, scheduledFor },
    });
  }
}

/** Cancel reminders for an appointment that was cancelled / completed. */
export async function cancelReminders(appointmentId: string) {
  await prisma.reminder.updateMany({
    where: { appointmentId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
