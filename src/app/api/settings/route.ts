export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";
import { ok, handleError } from "@/lib/api";

// GET /api/settings  -> clinic + settings for the current tenant
export async function GET() {
  try {
    const session = await requireSession();
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.clinicId },
      include: { settings: true },
    });
    return ok(clinic);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/settings  -> update AI knowledge base & automation toggles
export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = settingsSchema.parse(await req.json());

    // whatsappNumber lives on the Clinic; everything else on ClinicSettings.
    if (body.whatsappNumber !== undefined) {
      await prisma.clinic.update({
        where: { id: session.clinicId },
        data: { whatsappNumber: body.whatsappNumber || null },
      });
    }

    const { whatsappNumber, ...settingsData } = body;
    const settings = await prisma.clinicSettings.upsert({
      where: { clinicId: session.clinicId },
      update: settingsData as never,
      create: { clinicId: session.clinicId, ...(settingsData as object) },
    });

    return ok(settings);
  } catch (err) {
    return handleError(err);
  }
}