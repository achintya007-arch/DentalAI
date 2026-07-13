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

/**
 * A pre-approved template send. Required for any business-initiated message
 * outside WhatsApp's 24-hour customer-service window (all scheduled follow-ups
 * and reminders). `template` is our internal template key (see lib/templates);
 * providers map it to their registered template name/id. `params` fill the
 * template's {{1}}..{{n}} placeholders in order. `bodyPreview` is the rendered
 * text we store in the conversation and what the mock provider prints.
 */
export type TemplateMessage = {
  to: string;
  template: string;
  params: string[];
  bodyPreview: string;
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
  /** Free-form text. ONLY valid inside the 24h customer-service window. */
  sendText(msg: OutboundMessage): Promise<SendResult>;
  /** Pre-approved template message. Safe outside the 24h window. */
  sendTemplate(msg: TemplateMessage): Promise<SendResult>;
  /** Parse a raw webhook payload into normalised inbound messages. */
  parseInbound(payload: unknown): InboundMessage[];
  /**
   * Authenticate an inbound webhook request BEFORE trusting its body.
   * Receives the exact raw request body (needed for HMAC) and the request
   * headers. Returns true only if the request provably came from the provider.
   */
  verifySignature(rawBody: string, headers: Headers): boolean;
}
