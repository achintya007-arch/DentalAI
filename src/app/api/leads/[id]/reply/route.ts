import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { getWhatsApp } from "@/lib/whatsapp";
import { canSendFreeForm } from "@/lib/whatsapp/window";
import { z } from "zod";

const replySchema = z.object({ body: z.string().min(1).max(2000) });

// POST /api/leads/:id/reply — staff sends a manual WhatsApp message.
// Enforces the 24h customer-service window: outside it, free-form sends are
// rejected by WhatsApp anyway, so we fail fast with a clear explanation.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const { body } = replySchema.parse(await req.json());

    const lead = await prisma.lead.findFirst({
      where: { id: params.id, clinicId: session.clinicId },
      include: { conversation: true },
    });
    if (!lead || !lead.conversation) return fail("Lead not found", 404);
    if (lead.optOutAt) return fail("This patient has opted out of messages (STOP)", 422);

    if (!(await canSendFreeForm(lead.conversation.id))) {
      return fail(
        "Outside the WhatsApp 24-hour window — you can only reply within 24h of the patient's last message",
        422
      );
    }

    const wa = getWhatsApp();
    const res = await wa.sendText({ to: lead.phone, body });
    if (!res.ok) return fail(`WhatsApp send failed: ${res.error ?? "unknown error"}`, 502);

    const message = await prisma.message.create({
      data: {
        conversationId: lead.conversation.id,
        direction: "OUTBOUND",
        sender: "HUMAN",
        body,
        externalId: res.externalId,
      },
    });
    return ok(message, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
