import crypto from "node:crypto";
import type { WhatsAppProvider, OutboundMessage, SendResult, InboundMessage } from "../types";

// Gupshup provider — popular India-first WhatsApp BSP.
// Docs: https://docs.gupshup.io/docs/whatsapp-api
export class GupshupProvider implements WhatsAppProvider {
  readonly name = "gupshup";

  private apiKey = process.env.GUPSHUP_API_KEY ?? "";
  private appName = process.env.GUPSHUP_APP_NAME ?? "";
  private source = process.env.GUPSHUP_SOURCE_NUMBER ?? "";
  private webhookSecret = process.env.GUPSHUP_WEBHOOK_SECRET ?? "";

  // Gupshup lets you configure a secret token sent on every inbound callback.
  // Configure it as a header token and compare in constant time. We fail closed
  // if no secret is configured so the endpoint is never silently open.
  verifySignature(_rawBody: string, headers: Headers): boolean {
    if (!this.webhookSecret) return false;
    const provided = headers.get("x-gupshup-signature") ?? headers.get("apikey") ?? "";
    const a = Buffer.from(provided);
    const b = Buffer.from(this.webhookSecret);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async sendText(msg: OutboundMessage): Promise<SendResult> {
    try {
      const form = new URLSearchParams({
        channel: "whatsapp",
        source: this.source,
        destination: msg.to.replace("+", ""),
        "src.name": this.appName,
        message: JSON.stringify({ type: "text", text: msg.body }),
      });
      const res = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
        method: "POST",
        headers: {
          apikey: this.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = (await res.json()) as { messageId?: string; message?: string };
      if (!res.ok) return { ok: false, externalId: null, error: data.message ?? "send failed" };
      return { ok: true, externalId: data.messageId ?? null };
    } catch (err) {
      return { ok: false, externalId: null, error: (err as Error).message };
    }
  }

  parseInbound(payload: unknown): InboundMessage[] {
    // Gupshup inbound shape: { type: 'message', payload: { sender, payload: { text } } }
    const p = payload as any;
    if (p?.type !== "message") return [];
    const text = p?.payload?.payload?.text;
    if (!text) return [];
    return [
      {
        from: `+${p.payload.sender.phone}`,
        to: `+${this.source}`,
        body: text,
        externalId: p.payload.id ?? `gs_${Date.now()}`,
        timestamp: new Date(),
      },
    ];
  }
}
