// ----------------------------------------------------------------------------
// WhatsApp 24-hour customer-service window + consent helpers.
//
// Rules enforced here:
//  - Free-form text may only be sent within 24h of the patient's last inbound
//    message. Outside that, only pre-approved templates are allowed.
//  - No proactive sends of any kind to a lead that has opted out (STOP).
// ----------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Pure check: is `lastInboundAt` recent enough to allow free-form sends? */
export function isWithinWindow(lastInboundAt: Date | null | undefined, now = new Date()): boolean {
  if (!lastInboundAt) return false;
  return now.getTime() - lastInboundAt.getTime() < WINDOW_MS;
}

/** DB check for a conversation: can we send free-form text right now? */
export async function canSendFreeForm(conversationId: string, now = new Date()): Promise<boolean> {
  const lastInbound = await prisma.message.findFirst({
    where: { conversationId, direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return isWithinWindow(lastInbound?.createdAt, now);
}

const STOP_WORDS = new Set(["stop", "unsubscribe", "stop all", "opt out", "optout"]);
const START_WORDS = new Set(["start", "unstop", "resume"]);

export function isStopMessage(body: string): boolean {
  return STOP_WORDS.has(body.trim().toLowerCase());
}

export function isStartMessage(body: string): boolean {
  return START_WORDS.has(body.trim().toLowerCase());
}
