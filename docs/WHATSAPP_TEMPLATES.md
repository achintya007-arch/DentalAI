# WhatsApp Template Registration Guide

WhatsApp policy: any business-initiated message **outside the 24-hour
customer-service window** must use a **pre-approved template**. All scheduled
sends in DentalFlow (follow-ups, reminders, weekly reports) therefore go
through templates — the code refuses nothing silently; unregistered templates
fail with a clear error in the cron result.

Register the six templates below with your provider **before** onboarding a
real clinic. Body text must match what you register (params are `{{n}}`).

| Internal key | Category | Body (register exactly this) |
|---|---|---|
| `followup_day1` | MARKETING | Hi {{1}}! Just checking in from {{2}} 🙂 Would you like to book your dental visit? Reply with a day & time that suits you. Reply STOP to opt out. |
| `followup_day3` | MARKETING | Hello {{1}}, still interested in {{2}}? We have slots opening up this week at {{3}}. Reply with a time and we'll book you in. Reply STOP to opt out. |
| `followup_day7` | MARKETING | Hi {{1}}, last reminder from {{2}} 🦷 — your smile matters! Reply anytime and we'll help you book. Reply STOP to opt out. |
| `reminder_24h` | UTILITY | Reminder: {{1}}, you have a dental appointment at {{2}} tomorrow ({{3}}). Reply CONFIRM to keep it or RESCHEDULE to change. See you! 🦷 |
| `reminder_2h` | UTILITY | Hi {{1}}! Your appointment at {{2}} is in ~2 hours ({{3}}). We look forward to seeing you 😊 |
| `weekly_report` | UTILITY | 📊 {{1}} — your week on DentalFlow AI: {{2}} inquiries, {{3}} appointments booked, {{4}} upcoming this week. Every reply answered in seconds, 24×7. 🦷 |

Notes
- **Meta Cloud API:** create each template in WhatsApp Manager with the *same
  name* as the internal key, language matching `META_TEMPLATE_LANG` (default
  `en`). Approval usually takes minutes–hours.
- **Gupshup:** create the templates in the Gupshup dashboard, then put their
  template IDs in `GUPSHUP_TEMPLATE_IDS` (JSON map, see `.env.example`).
- Follow-ups are MARKETING category (≈₹0.86/msg in India) — they require the
  patient's opt-in, which DentalFlow records on their first inbound message and
  revokes on STOP. Reminders/reports are UTILITY (≈₹0.12/msg).
- Cost sanity: a fully-worked lead costs ≈₹2.6 in marketing messages — against
  a ₹3,000+ patient, ignore it.

Compliance behaviours already enforced in code
- First inbound message stamps `Lead.optInAt`; `STOP` stamps `optOutAt`,
  cancels pending automations, and sends one confirmation; `START` re-opts in.
- Scheduled sends always use templates; the manual staff reply box refuses
  free-form sends outside the 24h window with a clear error.
