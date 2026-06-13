import { NextResponse } from "next/server";
import { getWhatsApp } from "@/lib/whatsapp";
import { handleInbound } from "@/lib/conversation";

// Webhook for inbound WhatsApp messages.
// GET  -> Meta webhook verification handshake.
// POST -> receive messages, normalise via provider, process each.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const wa = getWhatsApp();
  const messages = wa.parseInbound(payload);

  // Process sequentially; volumes are tiny per clinic. Errors per-message are
  // swallowed so one bad message can't block the rest or trigger provider
  // retries that would duplicate work.
  for (const msg of messages) {
    try {
      await handleInbound(msg);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[webhook] failed to handle message", err);
    }
  }

  // Always 200 so the provider doesn't retry endlessly.
  return NextResponse.json({ received: messages.length });
}
