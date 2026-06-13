import type { WhatsAppProvider, OutboundMessage, SendResult, InboundMessage } from "../types";

// Local-dev provider. Logs outbound messages to the console instead of calling
// a real API, and accepts a simple JSON inbound shape so you can simulate
// patients from the /api/whatsapp/webhook endpoint or a curl command.
export class MockProvider implements WhatsAppProvider {
  readonly name = "mock";

  // The mock provider has no real signature. To prevent the unauthenticated
  // injection of messages in production, it is only trusted outside production
  // unless explicitly allowed via ALLOW_MOCK_WEBHOOK=true (e.g. a sandbox demo).
  verifySignature(): boolean {
    return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_WEBHOOK === "true";
  }

  async sendText(msg: OutboundMessage): Promise<SendResult> {
    // eslint-disable-next-line no-console
    console.log(`[whatsapp:mock] -> ${msg.to}: ${msg.body}`);
    return { ok: true, externalId: `mock_${Date.now()}` };
  }

  parseInbound(payload: unknown): InboundMessage[] {
    // Expected shape: { from, to, body, id? }
    const p = payload as Record<string, unknown>;
    if (!p?.from || !p?.body) return [];
    return [
      {
        from: String(p.from),
        to: String(p.to ?? ""),
        body: String(p.body),
        externalId: String(p.id ?? `mock_in_${Date.now()}`),
        timestamp: new Date(),
      },
    ];
  }
}
