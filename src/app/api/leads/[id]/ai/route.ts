import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { z } from "zod";

const pauseSchema = z.object({ paused: z.boolean() });

// PATCH /api/leads/:id/ai — pause/resume the AI for this conversation so a
// human can take over.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const { paused } = pauseSchema.parse(await req.json());

    const lead = await prisma.lead.findFirst({
      where: { id: params.id, clinicId: session.clinicId },
      include: { conversation: true },
    });
    if (!lead || !lead.conversation) return fail("Lead not found", 404);

    const conversation = await prisma.conversation.update({
      where: { id: lead.conversation.id },
      data: { aiPaused: paused },
    });
    return ok({ aiPaused: conversation.aiPaused });
  } catch (err) {
    return handleError(err);
  }
}
