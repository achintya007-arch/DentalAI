import { prisma } from "@/lib/prisma";
import { getWhatsApp } from "@/lib/whatsapp";
import { render, type TemplateKey } from "@/lib/whatsapp/templates";
import type { FollowUpStage, ReminderKind } from "@prisma/client";

// ----------------------------------------------------------------------------
// Cron-driven processors. Called by /api/cron/*. Each picks up PENDING rows
// that are now due, sends a WhatsApp message, and marks them SENT.
//
// Compliance: scheduled sends are business-initiated and can never assume the
// 24h customer-service window is open, so they ALWAYS use pre-approved
// templates (sendTemplate), never free-form text. Leads that opted out (STOP)
// are skipped and their automations cancelled.
//
// Concurrency: each row is atomically CLAIMED (conditional PENDING->SENT
// update) before sending, so overlapping runs / retries can't double-message.
// ----------------------------------------------------------------------------

const FOLLOWUP_TEMPLATE: Record<FollowUpStage, TemplateKey> = {
  DAY_1: "followup_day1",
  DAY_3: "followup_day3",
  DAY_7: "followup_day7",
};

const REMINDER_TEMPLATE: Record<ReminderKind, TemplateKey> = {
  HOURS_24: "reminder_24h",
  HOURS_2: "reminder_2h",
};

export async function processFollowUps(now = new Date()): Promise<number> {
  const due = await prisma.followUp.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { lead: true, clinic: true },
    take: 100,
  });

  const wa = getWhatsApp();
  let sent = 0;

  for (const f of due) {
    // Booked, lost, or opted out? Cancel instead of sending.
    if (f.lead.status === "BOOKED" || f.lead.status === "LOST" || f.lead.optOutAt) {
      await prisma.followUp.update({ where: { id: f.id }, data: { status: "CANCELLED" } });
      continue;
    }
    // Atomically claim: only one worker can flip PENDING -> SENT.
    const claim = await prisma.followUp.updateMany({
      where: { id: f.id, status: "PENDING" },
      data: { status: "SENT", sentAt: now },
    });
    if (claim.count !== 1) continue;

    const template = FOLLOWUP_TEMPLATE[f.stage];
    const params =
      f.stage === "DAY_3"
        ? [f.lead.name ?? "there", f.lead.treatmentInterest ?? "your treatment", f.clinic.name]
        : [f.lead.name ?? "there", f.clinic.name];

    const res = await wa.sendTemplate({
      to: f.lead.phone,
      template,
      params,
      bodyPreview: render(template, params),
    });
    if (!res.ok) {
      // Release the claim so a later run can retry.
      await prisma.followUp.update({ where: { id: f.id }, data: { status: "FAILED", sentAt: null } });
      continue;
    }
    if (f.stage === "DAY_7") {
      await prisma.lead.update({ where: { id: f.leadId }, data: { status: "LOST" } });
    }
    sent++;
  }
  return sent;
}

export async function processReminders(now = new Date()): Promise<number> {
  const due = await prisma.reminder.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { appointment: { include: { lead: true } }, clinic: true },
    take: 100,
  });

  const wa = getWhatsApp();
  let sent = 0;

  for (const r of due) {
    // Cancelled/finished appointment, or patient opted out? Cancel the reminder.
    if (
      ["CANCELLED", "NO_SHOW", "COMPLETED"].includes(r.appointment.status) ||
      r.appointment.lead.optOutAt
    ) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
      continue;
    }
    // Atomically claim before sending.
    const claim = await prisma.reminder.updateMany({
      where: { id: r.id, status: "PENDING" },
      data: { status: "SENT", sentAt: now },
    });
    if (claim.count !== 1) continue;

    const time = r.appointment.scheduledAt.toLocaleString("en-IN", {
      timeZone: r.clinic.timezone,
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const template = REMINDER_TEMPLATE[r.kind];
    const params = [r.appointment.patientName, r.clinic.name, time];

    const res = await wa.sendTemplate({
      to: r.appointment.phone,
      template,
      params,
      bodyPreview: render(template, params),
    });
    if (!res.ok) {
      await prisma.reminder.update({ where: { id: r.id }, data: { status: "FAILED", sentAt: null } });
      continue;
    }
    sent++;
  }
  return sent;
}

// ----------------------------------------------------------------------------
// Monday owner report — the retention hook. Sends each active clinic's last-7-
// day numbers to the owner's WhatsApp (ClinicSettings.ownerPhone, opt-in by
// virtue of being configured by the owner themself).
// ----------------------------------------------------------------------------

export async function processWeeklyReports(now = new Date()): Promise<number> {
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true, settings: { isNot: null } },
    include: { settings: true },
  });

  const wa = getWhatsApp();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let sent = 0;

  for (const clinic of clinics) {
    const ownerPhone = clinic.settings?.ownerPhone;
    if (!ownerPhone) continue;

    const [inquiries, booked, upcoming] = await Promise.all([
      prisma.lead.count({ where: { clinicId: clinic.id, createdAt: { gte: since } } }),
      prisma.appointment.count({ where: { clinicId: clinic.id, createdAt: { gte: since } } }),
      prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          scheduledAt: { gte: now, lte: weekAhead },
          status: { in: ["REQUESTED", "CONFIRMED"] },
        },
      }),
    ]);

    const params = [clinic.name, String(inquiries), String(booked), String(upcoming)];
    const res = await wa.sendTemplate({
      to: ownerPhone,
      template: "weekly_report",
      params,
      bodyPreview: render("weekly_report", params),
    });
    if (res.ok) sent++;
  }
  return sent;
}
