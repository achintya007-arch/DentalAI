export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createAppointmentSchema } from "@/lib/validation";
import { ok, handleError } from "@/lib/api";
import { scheduleReminders, cancelFollowUps } from "@/lib/scheduling";
import { hasConflict } from "@/lib/booking";
import { fail } from "@/lib/api";

// GET /api/appointments?from=ISO&to=ISO  -> list appointments
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: session.clinicId,
        ...(from || to
          ? { scheduledAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      orderBy: { scheduledAt: "asc" },
      take: 300,
    });
    return ok(appointments);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/appointments  -> manually create / confirm a booking
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = createAppointmentSchema.parse(await req.json());

    // Double-booking guard: reject slots within ±30 min of an active booking.
    if (await hasConflict(session.clinicId, new Date(body.scheduledAt))) {
      return fail("This slot conflicts with another appointment within 30 minutes", 409);
    }

    // Find or create the lead for this phone.
    const lead = await prisma.lead.upsert({
      where: { clinicId_phone: { clinicId: session.clinicId, phone: body.phone } },
      update: { name: body.patientName, status: "BOOKED" },
      create: {
        clinicId: session.clinicId,
        name: body.patientName,
        phone: body.phone,
        treatmentInterest: body.treatment,
        status: "BOOKED",
        source: "MANUAL",
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: session.clinicId,
        leadId: lead.id,
        patientName: body.patientName,
        phone: body.phone,
        treatment: body.treatment,
        scheduledAt: new Date(body.scheduledAt),
        status: "CONFIRMED",
        notes: body.notes,
      },
    });

    await cancelFollowUps(lead.id);
    await scheduleReminders(session.clinicId, appointment.id, appointment.scheduledAt);

    return ok(appointment, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}