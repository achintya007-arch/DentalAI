# 🦷 DentalFlow AI

**An AI WhatsApp receptionist for Indian dental clinics.** It replies to patient
inquiries instantly, books appointments, sends reminders, and follows up with
leads automatically — so clinics stop losing revenue to missed messages.

> Goal of this repo: a **simple, deployable MVP** that can land its first paying
> customer within 30 days and reach ₹10,000 MRR fast. Built to be live in
> under two weeks. Revenue first, technical perfection later.

---

## What it does

| Feature | How it works |
| --- | --- |
| 🤖 **AI WhatsApp receptionist** | Inbound WhatsApp messages hit a webhook → OpenAI replies using the clinic's FAQs, treatments and hours. |
| 📅 **Appointment booking** | The AI captures name, phone, treatment and a preferred slot, then creates an appointment record. |
| 🔁 **Follow-up automation** | If a lead doesn't book, it's nudged on day 1, 3 and 7. |
| ⏰ **Reminders** | Confirmed appointments get reminders 24h and 2h before. |
| 📊 **Clinic dashboard** | Inquiries, bookings, conversion rate and follow-up status in one screen. |

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- **OpenAI API** (`gpt-4o-mini` by default — cheap and fast)
- **WhatsApp provider abstraction** (Mock / Meta Cloud API / Gupshup)
- **Vercel** (hosting + Cron for automations)

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#    Fill in DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY.
#    Leave WHATSAPP_PROVIDER=mock for local dev.

# 3. Create the database schema + demo data
npm run db:push
npm run db:seed

# 4. Run
npm run dev
# open http://localhost:3000
```

**Demo login:** `demo@dentalflow.ai` / `demo12345`

### Simulate a patient message locally (mock provider)

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"from":"+919811111111","to":"+919999900000","body":"Hi, how much for teeth cleaning?"}'
```

The AI's reply is logged to the dev server console (`[whatsapp:mock] -> …`) and
the conversation appears under **Leads** in the dashboard.

---

## Folder structure

```
dentalflow-ai/
├─ prisma/
│  ├─ schema.prisma         # Prisma data model (source of truth)
│  ├─ schema.sql            # Raw SQL equivalent (reference)
│  └─ seed.ts               # Demo clinic + sample data
├─ src/
│  ├─ middleware.ts         # Protects /dashboard, /leads, /appointments, /settings
│  ├─ app/
│  │  ├─ page.tsx           # Landing page
│  │  ├─ login/             # Login
│  │  ├─ signup/            # Signup (creates clinic + owner)
│  │  ├─ (dashboard)/       # Authenticated app shell
│  │  │  ├─ layout.tsx      # Sidebar + session guard
│  │  │  ├─ dashboard/      # Metrics
│  │  │  ├─ leads/          # Lead list + conversation drawer
│  │  │  ├─ appointments/   # Appointment list + new-booking modal
│  │  │  └─ settings/       # AI knowledge base + automation toggles
│  │  └─ api/
│  │     ├─ auth/           # signup, login, logout
│  │     ├─ whatsapp/webhook/   # inbound messages (GET verify, POST receive)
│  │     ├─ leads/          # list/create + [id] detail/update
│  │     ├─ appointments/   # list/create + [id] update/cancel
│  │     ├─ settings/       # get/update clinic config
│  │     ├─ dashboard/stats # headline metrics
│  │     └─ cron/           # followups + reminders (Vercel Cron)
│  ├─ components/           # Sidebar, UI primitives
│  └─ lib/
│     ├─ prisma.ts          # Prisma singleton
│     ├─ auth.ts            # JWT cookie sessions + bcrypt
│     ├─ conversation.ts    # inbound → AI → booking → reply orchestration
│     ├─ automations.ts     # cron processors (follow-ups, reminders)
│     ├─ scheduling.ts      # schedule/cancel follow-ups & reminders
│     ├─ validation.ts      # Zod schemas
│     ├─ api.ts             # API response helpers
│     ├─ ai/receptionist.ts # OpenAI prompt + JSON extraction
│     └─ whatsapp/          # provider abstraction (mock/meta/gupshup)
├─ docs/                    # Full product & engineering documentation
├─ vercel.json             # Cron schedules
└─ .env.example
```

---

## Documentation

The complete product and engineering spec lives in [`docs/`](./docs):

1. [Product Specification](./docs/01-PRODUCT-SPEC.md)
2. [Architecture](./docs/02-ARCHITECTURE.md) — database, API, frontend, backend, auth
3. [Wireframes](./docs/03-WIREFRAMES.md)
4. [User Flows](./docs/04-USER-FLOWS.md)
5. [Roadmap](./docs/05-ROADMAP.md) — development, deployment & premium features

---

## Deploying

See [docs/05-ROADMAP.md → Deployment](./docs/05-ROADMAP.md#deployment-roadmap). In
short: push to GitHub → import to Vercel → add env vars → attach a Postgres
database → `prisma migrate deploy` → point your WhatsApp provider's webhook at
`/api/whatsapp/webhook`. Cron jobs run automatically from `vercel.json`.

---

## License

Proprietary — © DentalFlow AI. All rights reserved.
