import { prisma } from "@/lib/prisma";
import { getWhatsApp } from "@/lib/whatsapp";
import type { FollowUpStage, ReminderKind } from "@prisma/client";

// ----------------------------------------------------------------------------
// Cron-driven processors. Called every ~15 min by /api/cron/*. Each picks up
// PENDING rows that are now due, sends a WhatsApp message, and marks them SENT.
// Idempotent: a row is flipped to SENT before/at send so retries don't dupe.
// ----------------------------------------------------------------------------

const FOLLOWUP_COPY: Record<FollowUpStage, string> = {
  DAY_1: "Hi {name}! Just checking in 🙂 Would you like to book your dental visit at {clinic}? Reply with a day & time that suits you.",
  DAY_3: "Hello {name}, still keen on your {treatment}? We have slots opening up this week at {clinic}. Want me to book one for you?",
  DAY_7: "Hi {name}, last reminder from {clinic} 🦷 — your smile matters! Reply anytime and I'll help you book. Wishing you good health!",
};

const REMINDER_COPY: Record<ReminderKind, string> = {
  HOURS_24: "Reminder: you have a dental appointment at {clinic} tomorrow ({time}). Reply CONFIRM to keep it or RESCHEDULE to change. See you! 🦷",
  HOURS_2: "Hi {name}! Your appointment at {clinic} is in ~2 hours ({time}). We look forward to seeing you 😊",
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export async function processFollowUps(now = new Date()): Promise<number> {
  const due = await prisma.followUp.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { lead: true, clinic: true },
    take: 100,
  });

  const wa = getWhatsApp();
  let sent = 0;

  for (const f of due) {
    // Lead already booked? Cancel instead of sending.
    if (f.lead.status === "BOOKED" || f.lead.status === "LOST") {
      await prisma.followUp.update({ where: { id: f.id }, data: { status: "CANCELLED" } });
      continue;
    }
    const body = fill(FOLLOWUP_COPY[f.stage], {
      name: f.lead.name ?? "there",
      clinic: f.clinic.name,
      treatment: f.lead.treatmentInterest ?? "treatment",
    });
    const res = await wa.sendText({ to: f.lead.phone, body });
    await prisma.followUp.update({
      where: { id: f.id },
      data: { status: res.ok ? "SENT" : "FAILED", sentAt: res.ok ? now : null },
    });
    // After the last stage with no booking, mark the lead lost.
    if (res.ok && f.stage === "DAY_7") {
      await prisma.lead.update({ where: { id: f.leadId }, data: { status: "LOST" } });
    }
    if (res.ok) sent++;
  }
  return sent;
}

export async function processReminders(now = new Date()): Promise<number> {
  const due = await prisma.reminder.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { appointment: true, clinic: true },
    take: 100,
  });

  const wa = getWhatsApp();
  let sent = 0;

  for (const r of due) {
    // Don't remind for cancelled/no-show appointments.
    if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(r.appointment.status)) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
      continue;
    }
    const time = r.appointment.scheduledAt.toLocaleString("en-IN", {
      timeZone: r.clinic.timezone,
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const body = fill(REMINDER_COPY[r.kind], {
      name: r.appointment.patientName,
      clinic: r.clinic.name,
      time,
    });
    const res = await wa.sendText({ to: r.appointment.phone, body });
    await prisma.reminder.update({
      where: { id: r.id },
      data: { status: res.ok ? "SENT" : "FAILED", sentAt: res.ok ? now : null },
    });
    if (res.ok) sent++;
  }
  return sent;
}
