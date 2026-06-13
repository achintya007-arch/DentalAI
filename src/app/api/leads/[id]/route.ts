import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

// GET /api/leads/:id  -> a lead with its conversation history
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const lead = await prisma.lead.findFirst({
      where: { id: params.id, clinicId: session.clinicId },
      include: {
        conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } },
        appointments: { orderBy: { scheduledAt: "desc" } },
        followUps: true,
      },
    });
    if (!lead) return fail("Lead not found", 404);
    return ok(lead);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/leads/:id  -> update status / notes / name
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = (await req.json()) as Record<string, unknown>;

    const lead = await prisma.lead.findFirst({
      where: { id: params.id, clinicId: session.clinicId },
    });
    if (!lead) return fail("Lead not found", 404);

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: {
        name: typeof body.name === "string" ? body.name : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        treatmentInterest:
          typeof body.treatmentInterest === "string" ? body.treatmentInterest : undefined,
        status: typeof body.status === "string" ? (body.status as never) : undefined,
      },
    });
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
