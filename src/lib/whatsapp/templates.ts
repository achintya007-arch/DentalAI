// ----------------------------------------------------------------------------
// Central registry of WhatsApp message templates.
//
// WhatsApp policy: business-initiated messages outside the 24-hour customer-
// service window MUST use a pre-approved template. Every scheduled send
// (follow-ups, reminders, weekly reports) goes through these, always — a
// scheduled send can never assume the window is open.
//
// The bodies below are the copy to register with your provider (see
// docs/WHATSAPP_TEMPLATES.md). {{n}} placeholders are filled from `params`
// in order. `render()` produces the preview text we store in the conversation.
// ----------------------------------------------------------------------------

export type TemplateKey =
  | "followup_day1"
  | "followup_day3"
  | "followup_day7"
  | "reminder_24h"
  | "reminder_2h"
  | "weekly_report";

export const TEMPLATE_BODIES: Record<TemplateKey, string> = {
  followup_day1:
    "Hi {{1}}! Just checking in from {{2}} 🙂 Would you like to book your dental visit? Reply with a day & time that suits you. Reply STOP to opt out.",
  followup_day3:
    "Hello {{1}}, still interested in {{2}}? We have slots opening up this week at {{3}}. Reply with a time and we'll book you in. Reply STOP to opt out.",
  followup_day7:
    "Hi {{1}}, last reminder from {{2}} 🦷 — your smile matters! Reply anytime and we'll help you book. Reply STOP to opt out.",
  reminder_24h:
    "Reminder: {{1}}, you have a dental appointment at {{2}} tomorrow ({{3}}). Reply CONFIRM to keep it or RESCHEDULE to change. See you! 🦷",
  reminder_2h:
    "Hi {{1}}! Your appointment at {{2}} is in ~2 hours ({{3}}). We look forward to seeing you 😊",
  weekly_report:
    "📊 {{1}} — your week on DentalFlow AI: {{2}} inquiries, {{3}} appointments booked, {{4}} upcoming this week. Every reply answered in seconds, 24×7. 🦷",
};

/** Fill {{1}}..{{n}} with params to produce the human-readable message text. */
export function render(template: TemplateKey, params: string[]): string {
  return TEMPLATE_BODIES[template].replace(/\{\{(\d+)\}\}/g, (_, i) => params[Number(i) - 1] ?? "");
}
