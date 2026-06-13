import { prisma } from "@/lib/prisma";
import { getWhatsApp, type InboundMessage } from "@/lib/whatsapp";
import { runReceptionist, type ChatTurn, type ClinicContext } from "@/lib/ai/receptionist";
import { scheduleFollowUps, cancelFollowUps, scheduleReminders } from "@/lib/scheduling";

// ----------------------------------------------------------------------------
// The heart of the product. Handles one inbound WhatsApp message end-to-end:
//   find clinic -> upsert lead + conversation -> store inbound -> run AI ->
//   optionally create appointment -> send + store reply -> (re)schedule autos.
// ----------------------------------------------------------------------------

const MAX_HISTORY = 12; // recent turns sent to the model

export async function handleInbound(msg: InboundMessage): Promise<void> {
  // 1. Route to the clinic that owns the destination WhatsApp number.
  const clinic = await prisma.clinic.findFirst({
    where: { whatsappNumber: msg.to, isActive: true },
    include: { settings: true },
  });
  if (!clinic) {
    console.warn(`[conversation] no active clinic for number ${msg.to}`);
    return;
  }

  // 2. Idempotency: skip if we've already stored this provider message id.
  if (msg.externalId) {
    const existing = await prisma.message.findUnique({ where: { externalId: msg.externalId } });
    if (existing) return;
  }

  // 3. Upsert the lead (one per phone per clinic) and its conversation.
  const lead = await prisma.lead.upsert({
    where: { clinicId_phone: { clinicId: clinic.id, phone: msg.from } },
    update: { lastContactAt: new Date(), status: "ENGAGED" },
    create: {
      clinicId: clinic.id,
      phone: msg.from,
      status: "ENGAGED",
      source: "WHATSAPP",
      lastContactAt: new Date(),
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: { leadId: lead.id },
    update: {},
    create: { clinicId: clinic.id, leadId: lead.id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: MAX_HISTORY } },
  });

  // 4. Store the inbound message.
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      sender: "PATIENT",
      body: msg.body,
      externalId: msg.externalId || null,
    },
  });

  // If a human has taken over, or auto-reply is off, stop here.
  if (conversation.aiPaused || clinic.settings?.autoReply === false) return;

  // 5. Build context + history and run the receptionist.
  const history: ChatTurn[] = [...conversation.messages]
    .reverse()
    .map((m) => ({ role: m.sender === "PATIENT" ? "patient" : "assistant", content: m.body }));
  history.push({ role: "patient", content: msg.body });

  const ctx = buildClinicContext(clinic, clinic.settings);
  const result = await runReceptionist(ctx, history);

  // 6. Persist any extracted info on the lead.
  const updates: Record<string, unknown> = {};
  if (result.extracted.name && !lead.name) updates.name = result.extracted.name;
  if (result.extracted.treatmentInterest) updates.treatmentInterest = result.extracted.treatmentInterest;
  if (result.extracted.name || result.extracted.treatmentInterest) updates.status = "QUALIFIED";
  if (Object.keys(updates).length) {
    await prisma.lead.update({ where: { id: lead.id }, data: updates });
  }

  // 7. If the AI gathered enough to book, create the appointment.
  if (result.readyToBook && result.extracted.preferredSlotISO) {
    const slot = new Date(result.extracted.preferredSlotISO);
    if (!isNaN(slot.getTime())) {
      const appt = await prisma.appointment.create({
        data: {
          clinicId: clinic.id,
          leadId: lead.id,
          patientName: result.extracted.name || lead.name || "Patient",
          phone: lead.phone,
          treatment: result.extracted.treatmentInterest || lead.treatmentInterest,
          scheduledAt: slot,
          status: "REQUESTED",
        },
      });
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "BOOKED" } });
      await cancelFollowUps(lead.id);
      if (clinic.settings?.remindersEnabled !== false) {
        await scheduleReminders(clinic.id, appt.id, slot);
      }
    }
  } else if (clinic.settings?.followUpsEnabled !== false) {
    // Not booked yet -> make sure follow-ups are scheduled.
    await scheduleFollowUps(clinic.id, lead.id);
  }

  // 8. Send the reply and store it.
  const wa = getWhatsApp();
  const sent = await wa.sendText({ to: msg.from, body: result.reply });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      sender: "AI",
      body: result.reply,
      externalId: sent.externalId,
    },
  });
}

function buildClinicContext(
  clinic: { name: string; timezone: string },
  settings: {
    greeting: string;
    aboutClinic: string;
    addressText: string;
    treatments: unknown;
    faqs: unknown;
    businessHours: unknown;
  } | null
): ClinicContext {
  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: clinic.timezone });
  return {
    clinicName: clinic.name,
    greeting: settings?.greeting ?? "Hi! How can we help you today? 🦷",
    aboutClinic: settings?.aboutClinic ?? "",
    addressText: settings?.addressText ?? "",
    treatments: (settings?.treatments as ClinicContext["treatments"]) ?? [],
    faqs: (settings?.faqs as ClinicContext["faqs"]) ?? [],
    businessHours: (settings?.businessHours as ClinicContext["businessHours"]) ?? {},
    timezone: clinic.timezone,
    todayISO,
  };
}
