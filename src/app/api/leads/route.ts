export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { createLeadSchema } from "@/lib/validation";
import { ok, handleError } from "@/lib/api";
import { scheduleFollowUps } from "@/lib/scheduling";

// GET /api/leads?status=NEW&q=ravi  -> list leads for the current clinic
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");

    const leads = await prisma.lead.findMany({
      where: {
        clinicId: session.clinicId,
        ...(status ? { status: status as never } : {}),
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { _count: { select: { appointments: true } } },
    });

    return ok(leads);
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/leads  -> manually add a lead (e.g. walk-in / phone call)
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = createLeadSchema.parse(await req.json());

    const lead = await prisma.lead.upsert({
      where: { clinicId_phone: { clinicId: session.clinicId, phone: body.phone } },
      update: { name: body.name, treatmentInterest: body.treatmentInterest, notes: body.notes },
      create: {
        clinicId: session.clinicId,
        name: body.name,
        phone: body.phone,
        treatmentInterest: body.treatmentInterest,
        notes: body.notes,
        source: "MANUAL",
        status: "NEW",
      },
    });

    await scheduleFollowUps(session.clinicId, lead.id);
    return ok(lead, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}