import type { WhatsAppProvider } from "./types";
import { MockProvider } from "./providers/mock";
import { MetaProvider } from "./providers/meta";
import { GupshupProvider } from "./providers/gupshup";

export * from "./types";

let cached: WhatsAppProvider | null = null;

/** Returns the configured WhatsApp provider based on WHATSAPP_PROVIDER env. */
export function getWhatsApp(): WhatsAppProvider {
  if (cached) return cached;
  switch (process.env.WHATSAPP_PROVIDER) {
    case "meta":
      cached = new MetaProvider();
      break;
    case "gupshup":
      cached = new GupshupProvider();
      break;
    default:
      cached = new MockProvider();
  }
  return cached;
}
