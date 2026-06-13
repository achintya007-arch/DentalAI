import type { WhatsAppProvider, OutboundMessage, SendResult, InboundMessage } from "../types";

// WhatsApp Cloud API (Meta) provider.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
export class MetaProvider implements WhatsAppProvider {
  readonly name = "meta";

  private token = process.env.META_WHATSAPP_TOKEN ?? "";
  private phoneNumberId = process.env.META_PHONE_NUMBER_ID ?? "";

  async sendText(msg: OutboundMessage): Promise<SendResult> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: msg.to.replace("+", ""),
            type: "text",
            text: { body: msg.body },
          }),
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
