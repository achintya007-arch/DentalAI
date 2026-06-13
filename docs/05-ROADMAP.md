# DentalFlow AI — Roadmaps & Future

Covers: **development roadmap · deployment roadmap · future premium features.**
The whole plan is organised around one number: **time to first paying customer.**

---

## Development roadmap

Built to be live in **under 2 weeks** by one full-stack developer. Ship the
revenue path first; everything else is a fast-follow.

### Week 1 — Core loop (message in → booking out)

| Day | Deliverable | Status in this repo |
| --- | --- | --- |
| 1 | Project scaffold: Next.js + TS + Tailwind + Prisma; DB schema; auth (signup/login/session). | ✅ Done |
| 2 | WhatsApp provider abstraction (mock/meta/gupshup) + webhook endpoint. | ✅ Done |
| 3 | OpenAI receptionist (reply + JSON extraction) + conversation orchestrator. | ✅ Done |
| 4 | Appointment creation from AI; follow-up & reminder scheduling. | ✅ Done |
| 5 | Cron processors for follow-ups & reminders. | ✅ Done |

### Week 2 — Dashboard, polish, ship

| Day | Deliverable | Status in this repo |
| --- | --- | --- |
| 6 | Dashboard metrics + Leads list & conversation drawer. | ✅ Done |
| 7 | Appointments management + manual booking. | ✅ Done |
| 8 | Settings (AI knowledge base + automation toggles). | ✅ Done |
| 9 | Landing page + pricing. | ✅ Done |
| 10 | Deploy to Vercel + Postgres; connect a real WhatsApp number end-to-end. | ⏳ On deploy |
| 11–12 | White-glove onboard the first clinic; fix what real usage breaks. | ⏳ Sales |
| 13–14 | Buffer + first customer. | ⏳ |

> **Everything marked ✅ is implemented in this repository.** The remaining work
> is deployment + sales, not engineering.

### Immediate fast-follows (post-MVP, week 3–4, demand-driven)
- In-dashboard **human-takeover toggle** (`aiPaused` UI).
- **Razorpay payment link** on trial end (semi-automated billing).
- **WhatsApp template management** per provider (for compliant proactive sends).
- Empty-state onboarding checklist on the dashboard.
- Basic **email/WhatsApp alert to staff** on a new booking.

### Explicitly deferred (don't build until asked)
Slot-availability/calendar engine · multi-language UI · mobile apps · granular
RBAC · analytics beyond the headline metrics · automated subscription billing.

---

## Deployment roadmap

Target platform: **Vercel** (app + cron) + managed **PostgreSQL**
(Neon / Supabase / Vercel Postgres / Railway).

### Step 1 — Database
1. Create a Postgres instance (Neon free tier is plenty to start).
2. Copy the pooled connection string into `DATABASE_URL` (use `?sslmode=require`).

### Step 2 — Repository → Vercel
1. Push to GitHub.
2. Import the repo in Vercel (it auto-detects Next.js).
3. Set **Environment Variables** (from `.env.example`):
   - `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`)
   - `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4o-mini`
   - `WHATSAPP_PROVIDER` = `meta` or `gupshup`
   - provider creds (`META_*` or `GUPSHUP_*`)
   - `CRON_SECRET` (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL / custom domain

### Step 3 — Migrate the schema
- The `build` script runs `prisma generate`. Apply the schema once via either:
  - `npx prisma migrate deploy` (recommended; commit a migration first), or
  - `npx prisma db push` for the very first deploy.
- Optionally seed a demo clinic with `npm run db:seed`.

### Step 4 — Cron
`vercel.json` already declares the schedules:
```json
{ "crons": [
  { "path": "/api/cron/followups", "schedule": "0 */1 * * *" },
  { "path": "/api/cron/reminders", "schedule": "*/15 * * * *" }
]}
```
Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically; the endpoints
reject anything else.

### Step 5 — Connect WhatsApp
**Meta Cloud API:** set the webhook callback URL to
`https://<domain>/api/whatsapp/webhook` and the verify token to
`META_WEBHOOK_VERIFY_TOKEN`; subscribe to `messages`. **Gupshup:** point the app's
inbound webhook at the same URL.

### Step 6 — Smoke test
Message the clinic's WhatsApp number → confirm an AI reply, a `Lead` in the
dashboard, and (when you give a name + time) an `Appointment` with reminders
scheduled.

### Environments
- **Local:** `WHATSAPP_PROVIDER=mock`, simulate inbound via curl (see README).
- **Staging:** a separate Vercel project + Neon branch + a test WhatsApp number.
- **Production:** the real clinic number; rotate `AUTH_SECRET`/`CRON_SECRET`.

### Rollback & ops
- Vercel keeps immutable deployments — roll back in one click.
- Prisma migrations are versioned; never edit a shipped migration.
- Logs: Vercel dashboard. Add **Sentry** once there's paying traffic.

---

## Future premium features (monetisation ladder)

Ordered by how directly each one lets us **raise price or add a tier**. Build
when customers pull, not before.

### Tier-up / add-on revenue
1. **Smart calendar & slot management** — real availability, working hours,
   per-dentist calendars, no double-booking, Google Calendar sync. *(Pro+)*
2. **Payments & deposits** — collect a booking deposit or consultation fee over
   WhatsApp (Razorpay) to cut no-shows further. *(usage/transaction fee)*
3. **Recall & recare campaigns** — automatic 6-month cleaning reminders and
   post-treatment check-ins. Recurring revenue for the clinic = stickiness for
   us. *(Pro+)*
4. **Reviews engine** — after a completed appointment, ask happy patients for a
   Google review via WhatsApp. Directly grows the clinic's top of funnel. *(add-on)*
5. **Multi-location / multi-number** — chains and DSOs; per-branch dashboards and
   roll-up analytics. *(Clinic/Enterprise tier)*

### Stickiness / depth
6. **Voice & missed-call capture** — turn missed phone calls into WhatsApp
   follow-ups automatically.
7. **Broadcast campaigns** — compliant WhatsApp template blasts (festive offers,
   new services) to opted-in patients.
8. **Analytics & insights** — treatment-wise conversion, peak inquiry hours,
   receptionist response times, revenue attribution.
9. **Team & roles** — per-seat receptionist logins, activity audit, owner-only
   billing/settings.
10. **AI quality controls** — custom tone, guardrails, approved-answer library,
    per-clinic fine-tuning.
11. **Integrations** — Practo, popular Indian dental PMS/EHR, Tally for billing.
12. **WhatsApp + Instagram + web-chat** — one inbox across channels.

### Pricing evolution
```
v1 today:     Trial → Starter ₹1,499 → Pro ₹3,499   (manual billing)
6-month:      + Clinic/Enterprise (multi-location) + usage-based payments add-on
12-month:     per-seat + campaign credits + integration add-ons
```

**Guiding rule (unchanged):** a feature earns its place only if it books the
clinic more patients or saves measurable staff time. Everything else is a
distraction from getting to — and growing past — ₹10,000 MRR.
