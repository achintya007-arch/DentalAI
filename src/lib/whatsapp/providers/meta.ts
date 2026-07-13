import crypto from "node:crypto";
import type { WhatsAppProvider, OutboundMessage, TemplateMessage, SendResult, InboundMessage } from "../types";

// WhatsApp Cloud API (Meta) provider.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
export class MetaProvider implements WhatsAppProvider {
  readonly name = "meta";

  private token = process.env.META_WHATSAPP_TOKEN ?? "";
  private phoneNumberId = process.env.META_PHONE_NUMBER_ID ?? "";
  private appSecret = process.env.META_APP_SECRET ?? "";

  // Meta signs every webhook with HMAC-SHA256 over the raw body using the app
  // secret, in the `X-Hub-Signature-256: sha256=<hex>` header. We reject any
  // request that doesn't carry a matching signature.
  verifySignature(rawBody: string, headers: Headers): boolean {
    if (!this.appSecret) return false; // fail closed if misconfigured
    const header = headers.get("x-hub-signature-256") ?? "";
    const expected = "sha256=" + crypto.createHmac("sha256", this.appSecret).update(rawBody).digest("hex");
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async sendText(msg: OutboundMessage): Promise<SendResult> {
    return this.post({
      messaging_product: "whatsapp",
      to: msg.to.replace("+", ""),
      type: "text",
      text: { body: msg.body },
    });
  }

  // Template sends are required outside the 24h customer-service window. The
  // template must be registered & approved in WhatsApp Manager under the same
  // name (see docs/WHATSAPP_TEMPLATES.md). Language is configurable via
  // META_TEMPLATE_LANG (default "en").
  async sendTemplate(msg: TemplateMessage): Promise<SendResult> {
    return this.post({
      messaging_product: "whatsapp",
      to: msg.to.replace("+", ""),
      type: "template",
      template: {
        name: msg.template,
        language: { code: process.env.META_TEMPLATE_LANG || "en" },
        components: [
          {
            type: "body",
            parameters: msg.params.map((p) => ({ type: "text", text: p })),
          },
        ],
      },
    });
  }

  private async post(payload: unknown): Promise<SendResult> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
      if (!res.ok) return { ok: false, externalId: null, error: data.error?.message ?? "send failed" };
      return { ok: true, externalId: data.messages?.[0]?.id ?? null };
    } catch (err) {
      return { ok: false, externalId: null, error: (err as Error).message };
    }
  }

  parseInbound(payload: unknown): InboundMessage[] {
    // Meta webhook shape: entry[].changes[].value.messages[]
    const out: InboundMessage[] = [];
    const p = payload as any;
    for (const entry of p?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value;
        const businessNumber = value?.metadata?.display_phone_number ?? "";
        for (const m of value?.messages ?? []) {
          if (m.type !== "text") continue;
          out.push({
            from: `+${m.from}`,
            to: `+${businessNumber}`,
            body: m.text?.body ?? "",
            externalId: m.id,
            timestamp: new Date(Number(m.timestamp) * 1000),
          });
        }
      }
    }
    return out;
  }
}
