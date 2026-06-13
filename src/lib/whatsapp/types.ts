// ----------------------------------------------------------------------------
// WhatsApp provider abstraction.
// The rest of the app talks to `WhatsAppProvider` only — never to a vendor SDK
// directly — so we can swap Meta Cloud API / Gupshup / Twilio without touching
// business logic. India-first: Gupshup and Meta Cloud API are the primary
// targets; `mock` is used in local dev and tests.
// ----------------------------------------------------------------------------

export type OutboundMessage = {
  to: string; // E.164, e.g. +919876543210
  body: string;
};

export type SendResult = {
  externalId: string | null;
  ok: boolean;
  error?: string;
};

/** Normalised inbound message after parsing a provider-specific webhook. */
export type InboundMessage = {
  from: string; // patient phone, E.164
  to: string; // the clinic's WhatsApp number, E.164
  body: string;
  externalId: string; // provider message id (used for idempotency)
  timestamp: Date;
};

export interface WhatsAppProvider {
  readonly name: string;
  sendText(msg: OutboundMessage): Promise<SendResult>;
  /** Parse a raw webhook payload into normalised inbound messages. */
  parseInbound(payload: unknown): InboundMessage[];
  /**
   * Authenticate an inbound webhook request BEFORE trusting its body.
   * Receives the exact raw request body (needed for HMAC) and the request
   * headers. Returns true only if the request provably came from the provider.
   */
  verifySignature(rawBody: string, headers: Headers): boolean;
}
