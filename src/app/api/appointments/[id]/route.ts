import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { updateAppointmentSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";
import { scheduleReminders, cancelReminders } from "@/lib/scheduling";

// PATCH /api/appointments/:id  -> update status / reschedule
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = updateAppointmentSchema.parse(await req.json());

    const existing = await prisma.appointment.findFirst({
      where: { id: params.id, clinicId: session.clinicId },
    });
    if (!existing) return fail("Appointment not found", 404);

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: body.status,
        treatment: body.treatment,
        notes: body.notes,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
    });

    // Keep reminders in sync with status / time changes.
    if (body.status && ["CANCELLED", "NO_SHOW", "COMPLETED"].includes(body.status)) {
      await cancelReminders(updated.id);
    } else if (body.scheduledAt) {
      await scheduleReminders(session.clinicId, updated.id, updated.scheduledAt);
    }

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/appointments/:id  -> cancel (soft) + drop reminders
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const existing = await prisma.appointment.findFirst({
      where: { id: params.id, clinicId: session.clinicId },
    });
    if (!existing) return fail("Appointment not found", 404);

    await prisma.appointment.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
    await cancelReminders(params.id);
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
