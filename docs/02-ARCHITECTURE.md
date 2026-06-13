# DentalFlow AI — Architecture

Covers: **database schema · API architecture · frontend architecture · backend
architecture · authentication**. The guiding principle is the same as the
product: keep it simple, ship in two weeks, optimize for revenue.

---

## 0. System overview

A single **Next.js 14 (App Router)** application deployed on **Vercel** serves
both the marketing site, the authenticated dashboard, and the API (route
handlers). State lives in **PostgreSQL** via **Prisma**. The AI brain is the
**OpenAI API**. WhatsApp is reached through a **provider abstraction** so the
vendor can change without touching business logic. Automations run on **Vercel
Cron**.

```
                         ┌──────────────────────────────────────────┐
                         │              Vercel (Next.js)            │
   Patient ─WhatsApp─►   │                                          │
   Provider webhook  ──► │  /api/whatsapp/webhook                   │
                         │        │                                 │
                         │        ▼                                 │
                         │  lib/conversation ─► lib/ai/receptionist │──► OpenAI
                         │        │                                 │
   Vercel Cron ───────►  │  /api/cron/* ─► lib/automations          │
                         │        │                                 │
   Clinic staff ─HTTP─►  │  /dashboard, /api/* (auth via JWT cookie)│
                         │        │                                 │
                         └────────┼─────────────────────────────────┘
                                  ▼
                            PostgreSQL (Prisma)
                                  ▲
                         lib/whatsapp ──► Meta Cloud API / Gupshup (outbound)
```

Everything is **multi-tenant**: one row in `Clinic` is one paying tenant, and
every other table carries a `clinicId`. Queries are always scoped by the
session's `clinicId`.

---

## 1. Database schema

PostgreSQL, modelled in `prisma/schema.prisma` (raw SQL mirror in
`prisma/schema.sql`).

### Entity relationships

```
Clinic 1───1 ClinicSettings
Clinic 1───* User
Clinic 1───* Lead
Lead   1───1 Conversation 1───* Message
Lead   1───* Appointment
Lead   1───* FollowUp
Appointment 1───* Reminder
```

### Tables

| Table | Purpose | Key fields |
| --- | --- | --- |
| **Clinic** | Tenant. The WhatsApp number routes inbound messages here. | `whatsappNumber` (unique), `plan`, `trialEndsAt`, `timezone` |
| **ClinicSettings** | AI knowledge base + automation toggles. | `greeting`, `treatments` (JSON), `faqs` (JSON), `businessHours` (JSON), `autoReply`, `followUpsEnabled`, `remindersEnabled` |
| **User** | Login. Owner or receptionist, scoped to a clinic. | `email` (unique), `passwordHash`, `role` |
| **Lead** | A patient who reached out. The CRM record. | `phone`, `name`, `treatmentInterest`, `status`, `followUpStage`; unique `(clinicId, phone)` |
| **Conversation** | One thread per lead; can be `aiPaused` for human takeover. | `leadId` (unique), `aiPaused` |
| **Message** | One WhatsApp message. `externalId` gives idempotency. | `direction`, `sender`, `body`, `externalId` (unique) |
| **Appointment** | A booking. | `scheduledAt`, `status`, `patientName`, `phone`, `treatment` |
| **FollowUp** | Scheduled nudge for an un-booked lead. | `stage` (DAY_1/3/7), `scheduledFor`, `status`; unique `(leadId, stage)` |
| **Reminder** | Scheduled pre-appointment reminder. | `kind` (HOURS_24/2), `scheduledFor`, `status`; unique `(appointmentId, kind)` |

### Enums

`UserRole` · `PlanTier` · `LeadStatus (NEW→ENGAGED→QUALIFIED→BOOKED / LOST)` ·
`LeadSource` · `MessageDirection` · `MessageSender` · `AppointmentStatus` ·
`AutomationStatus` · `FollowUpStage` · `ReminderKind`.

### Design choices

- **JSON for settings** (`treatments`, `faqs`, `businessHours`) — these are read
  whole, edited whole, and only by the owning clinic. Normalising them into
  tables would add joins and migrations for zero query benefit. Classic
  "don't overengineer".
- **Unique `(clinicId, phone)`** — one lead per patient per clinic; inbound
  messages `upsert` against it.
- **Unique `externalId` on Message** — providers retry webhooks; this makes
  inbound processing idempotent.
- **Unique `(leadId, stage)` / `(appointmentId, kind)`** — automations are
  scheduled with `upsert`, so they can never be double-scheduled.
- **Indexes** on the hot paths: `Lead(clinicId, status)`,
  `Appointment(clinicId, scheduledAt)`, `FollowUp(status, scheduledFor)`,
  `Reminder(status, scheduledFor)`, `Message(conversationId, createdAt)`.
- **`onDelete: Cascade`** from `Clinic` downward — deleting a tenant cleans up
  everything.

---

## 2. API architecture

Implemented with **Next.js Route Handlers** under `src/app/api`. JSON in, JSON
out, shape `{ data }` on success / `{ error }` on failure (helpers in
`lib/api.ts`). Input validated with **Zod** (`lib/validation.ts`).

### Endpoints

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /api/auth/signup` | public | Create clinic + owner + settings, start session |
| `POST /api/auth/login` | public | Authenticate, set session cookie |
| `POST /api/auth/logout` | session | Clear session cookie |
| `GET /api/whatsapp/webhook` | provider token | Meta verification handshake |
| `POST /api/whatsapp/webhook` | provider | Receive inbound messages → process |
| `GET /api/leads` | session | List/filter/search leads |
| `POST /api/leads` | session | Manually add a lead |
| `GET /api/leads/:id` | session | Lead + full conversation + appointments |
| `PATCH /api/leads/:id` | session | Update status / notes / name |
| `GET /api/appointments` | session | List appointments (optional date range) |
| `POST /api/appointments` | session | Create/confirm a booking + schedule reminders |
| `PATCH /api/appointments/:id` | session | Update status / reschedule |
| `DELETE /api/appointments/:id` | session | Cancel + drop reminders |
| `GET /api/settings` | session | Clinic + settings |
| `PATCH /api/settings` | session | Update AI knowledge base & toggles |
| `GET /api/dashboard/stats` | session | Headline metrics |
| `GET /api/cron/followups` | `CRON_SECRET` | Process due follow-ups |
| `GET /api/cron/reminders` | `CRON_SECRET` | Process due reminders |

### Conventions

- **Tenant isolation**: every authenticated handler calls `requireSession()` and
  filters by `session.clinicId`. There is no way to read another clinic's data.
- **Error handling**: one `handleError()` turns Zod errors → 422, auth errors →
  401, everything else → 500 with a logged stack.
- **Idempotency**: the webhook dedupes on `Message.externalId`; cron processors
  flip rows to `SENT` so re-runs don't duplicate sends.
- **Webhook always 200**: so providers don't retry endlessly; per-message errors
  are caught and logged.
- **Cron auth**: `Authorization: Bearer <CRON_SECRET>`, sent by Vercel Cron.

---

## 3. Backend architecture

All server logic lives in `src/lib`, deliberately framework-light so it's
testable and portable.

| Module | Responsibility |
| --- | --- |
| `prisma.ts` | Single `PrismaClient` (avoids connection exhaustion on serverless). |
| `auth.ts` | Password hashing (bcrypt), JWT cookie sessions (jose), `requireSession()`. |
| `validation.ts` | Zod schemas for every API input. |
| `api.ts` | `ok()` / `fail()` / `handleError()` response helpers. |
| `conversation.ts` | **The core orchestrator.** Inbound message → route to clinic → upsert lead/conversation → store message → run AI → persist extraction → create appointment if ready → schedule/cancel automations → send + store reply. |
| `ai/receptionist.ts` | Builds the system prompt from clinic context, calls OpenAI in JSON mode, returns `{ reply, extracted, readyToBook }`. Fails safe. |
| `scheduling.ts` | Schedule/cancel follow-ups (day 1/3/7) and reminders (24h/2h) via idempotent upserts. |
| `automations.ts` | Cron processors: find due `PENDING` rows, send WhatsApp copy, mark `SENT`. |
| `whatsapp/` | Provider abstraction (see below). |

### WhatsApp provider abstraction

The rest of the app depends only on the `WhatsAppProvider` interface
(`sendText`, `parseInbound`), never a vendor SDK:

```
lib/whatsapp/index.ts   getWhatsApp() ─ picks provider from WHATSAPP_PROVIDER env
            ├─ providers/mock.ts     (local dev: logs to console)
            ├─ providers/meta.ts     (WhatsApp Cloud API)
            └─ providers/gupshup.ts  (India-first BSP)
```

Adding Twilio later is one new file implementing the interface — no business
logic changes. This is the one abstraction worth building up front because the
WhatsApp vendor decision is genuinely uncertain at MVP stage.

### The conversation flow (most important path)

```
handleInbound(msg):
  1. find active Clinic by msg.to (the clinic's WhatsApp number)
  2. dedupe on msg.externalId
  3. upsert Lead (clinicId, phone) + Conversation
  4. store inbound Message
  5. if aiPaused or autoReply off → stop (human handles it)
  6. build context (FAQs/treatments/hours) + last 12 turns → runReceptionist()
  7. persist extracted name / treatment; bump status to QUALIFIED
  8. if readyToBook + concrete slot → create Appointment, cancel follow-ups,
     schedule reminders;  else → ensure follow-ups scheduled
  9. send reply via provider, store outbound Message
```

---

## 4. Frontend architecture

Next.js App Router with a clear split between **server components** (data
fetching, auth-gated shells) and **client components** (interactive screens).

```
src/app/
├─ page.tsx              server  — marketing landing page
├─ login / signup        client  — auth forms (fetch the auth API)
└─ (dashboard)/          route group, authenticated
   ├─ layout.tsx         server  — getSession() guard + <Sidebar>
   ├─ dashboard/page.tsx server  — reads Prisma directly, force-dynamic
   ├─ leads/page.tsx     client  — list + filters + conversation drawer
   ├─ appointments/page  client  — list + status control + new-booking modal
   └─ settings/page.tsx  client  — knowledge base + automation toggles
```

- **`(dashboard)` route group** shares one authenticated layout (sidebar +
  session check). The Edge `middleware.ts` redirects unauthenticated users to
  `/login` before the page even renders.
- **Server components for read-heavy screens** (dashboard) hit Prisma directly —
  fewer round-trips, faster first paint.
- **Client components for interactive screens** (leads, appointments, settings)
  talk to the JSON API with `fetch`.
- **Styling**: Tailwind with a small set of component classes (`.btn`, `.card`,
  `.input`, `.badge`) in `globals.css`. No component library — keeps the bundle
  tiny and the look consistent.
- **Shared UI** in `src/components` (`Sidebar`, `StatCard`, badges,
  `PageHeader`). See [03-WIREFRAMES](./03-WIREFRAMES.md) and
  [Component architecture](#6-component-architecture).

---

## 5. Authentication

Lightweight, dependency-light, and good enough for an MVP — no third-party auth
service to configure or pay for.

- **Sessions**: a signed **JWT** (HS256 via `jose`) stored in an **httpOnly,
  secure, sameSite=lax cookie** (`dfa_session`), 30-day expiry. Payload:
  `{ userId, clinicId, role, email }`.
- **Passwords**: hashed with **bcrypt** (cost 10). Never stored or logged in
  plaintext.
- **Signup** (`/api/auth/signup`): creates `Clinic` + default `ClinicSettings` +
  owner `User` in one transaction, starts a 14-day trial, sets the session.
- **Login** (`/api/auth/login`): verifies bcrypt hash, sets the session.
- **Route protection**: Edge `middleware.ts` guards `/dashboard`, `/leads`,
  `/appointments`, `/settings` by verifying the cookie's JWT (no DB hit at the
  edge). API routes additionally call `requireSession()` and scope every query
  by `clinicId` — defense in depth.
- **Roles**: `OWNER` vs `RECEPTIONIST`. v1 treats them the same in the UI; the
  field exists so billing/settings can be owner-only later without a migration.

### Why not NextAuth / Clerk / Auth0?
For a single-tenant-per-clinic email+password MVP, a 60-line `auth.ts` is less
to learn, less to break, free, and fully under our control. We can migrate to a
managed provider later if SSO/social login becomes a requirement — the session
boundary (`getSession()` / `requireSession()`) is the only thing the rest of the
app depends on.

---

## 6. Component architecture

```
components/
├─ Sidebar.tsx     client — nav + clinic/user footer + logout
├─ ui.tsx          StatCard, LeadBadge, ApptBadge, PageHeader (presentational)
└─ (page-local)    LeadDrawer, NewAppointmentModal live next to their pages
                   because they're not reused elsewhere
```

Principle: **shared primitives live in `components/`; one-off pieces live beside
the page that uses them.** No premature abstraction — a modal used on exactly
one screen stays on that screen.

State management is intentionally boring: React `useState` + `fetch`. No Redux,
no React Query. Data volumes per clinic are small and screens re-fetch on
mutation. If/when real-time inbox is needed, add SWR or websockets then — not
now.

---

## 7. Non-functional notes

- **Performance**: serverless functions + a pooled Prisma client; small
  payloads; indexed hot queries. Cold starts are acceptable for this workload.
- **Cost control**: `gpt-4o-mini`, 12-turn context cap, 350-token reply cap.
- **Observability (v1)**: `console.*` logs surfaced in Vercel. Add Sentry +
  proper metrics post-PMF.
- **Security**: httpOnly cookies, bcrypt, Zod validation, tenant scoping on every
  query, cron secret, provider webhook verification.
- **Scalability**: the model and indexes comfortably handle hundreds of clinics.
  The first real bottleneck (cron throughput / WhatsApp rate limits) is a
  good problem to have and is addressed in the roadmap.
