# DentalFlow AI — Product Specification

> An AI WhatsApp receptionist that helps Indian dental clinics capture every
> lead, book more appointments, and reduce no-shows — without hiring more staff.

---

## 1. One-liner

**"Your clinic's WhatsApp, answered instantly — even at 2 AM."**

DentalFlow AI plugs into a clinic's existing WhatsApp number and acts as a
24×7 AI receptionist that answers questions, books appointments, reminds
patients, and follows up with leads automatically.

---

## 2. The problem

Indian dental clinics run lean. A single overworked receptionist (or the
dentist themselves) handles the phone, the front desk, and a flood of WhatsApp
messages. The result is leaking revenue:

- **Missed inquiries** — messages that arrive after hours or during busy
  periods go unanswered. The patient books with a competitor.
- **No follow-up** — a patient asks about braces, doesn't book immediately, and
  is never contacted again.
- **Forgotten appointments** — no-shows waste chair time the clinic can't
  reclaim.
- **Receptionist overwhelm** — repetitive questions ("timings?", "how much for
  cleaning?") eat the day.

A single converted patient is worth ₹5,000–₹50,000+ in lifetime value. Even one
recovered patient a month pays for the product many times over. **That gap
between "message received" and "patient booked" is the entire business.**

---

## 3. Target users

| | |
| --- | --- |
| **Primary market** | Independent dental clinics in India (India-first) |
| **Clinic size** | 1–10 dentists |
| **Buyer** | Clinic owner / lead dentist (makes the purchase decision) |
| **Daily user** | Receptionist / front-desk staff (lives in the dashboard) |
| **Channel** | WhatsApp — the default communication channel for Indian patients |

### Personas

- **Dr. Ravi (Owner, 38)** — owns a 2-chair clinic in Pune. Tech-comfortable but
  time-poor. Wants more bookings without managing more staff. Decides on price
  and ROI.
- **Sneha (Receptionist, 24)** — answers WhatsApp and the phone all day. Wants
  the repetitive questions to handle themselves so she can focus on patients in
  the clinic.

---

## 4. Goals & success metrics

### Business goals
- First **paying customer within 30 days**.
- **₹10,000 MRR** as fast as possible (≈7 Starter or 3 Pro clinics).
- MVP **built and deployable in under 2 weeks**.

### Product success metrics (per clinic)
- **Response rate**: % of inbound WhatsApp messages answered → target **100%**.
- **Conversion rate**: inquiries → booked appointments → target **+20–40%** vs
  baseline.
- **No-show rate**: target **−30%** via reminders.
- **Time-to-first-reply**: target **< 10 seconds**, 24×7.

### North-star metric
**Appointments booked per clinic per month.** It directly maps to the clinic's
revenue and therefore to retention and willingness to pay.

---

## 5. MVP scope

### In scope (v1)
1. **AI WhatsApp receptionist** — instant replies, FAQ answering, info capture.
2. **Appointment booking** — captures name, phone, treatment interest, preferred
   date/time → creates an appointment record.
3. **Follow-up automation** — day 1, day 3, day 7 nudges for un-booked leads.
4. **Appointment reminders** — 24h and 2h before.
5. **Clinic dashboard** — total inquiries, appointments booked, conversion rate,
   follow-up status, lead and appointment management.
6. **Settings** — clinic info, treatments & prices, FAQs, automation toggles,
   WhatsApp number.
7. **Auth & multi-tenancy** — clinic signup, owner/receptionist logins, isolated
   data per clinic.

### Explicitly out of scope (v1) — *to avoid overengineering*
- Payments/billing inside the app (collect via manual UPI / Razorpay link at
  first; automate later).
- Calendar/slot-availability engine (the AI captures a requested time; staff
  confirm). No double-booking prevention in v1.
- Multi-language NLP beyond what the LLM already does (English/Hinglish is
  enough to start).
- EHR / treatment records / billing for patients.
- Mobile apps (responsive web only).
- Granular roles/permissions beyond OWNER vs RECEPTIONIST.

> **Design principle:** every feature must move a clinic toward *more booked
> appointments*. If it doesn't, it waits.

---

## 6. How it works (high level)

```
Patient on WhatsApp
        │  "How much for teeth cleaning?"
        ▼
WhatsApp provider (Meta Cloud API / Gupshup)
        │  webhook
        ▼
/api/whatsapp/webhook ──► conversation engine
        │                       │ loads clinic context (FAQs, treatments, hours)
        │                       │ runs OpenAI receptionist
        │                       │ extracts name / treatment / slot
        │                       ▼
        │                  creates Lead, Appointment, schedules follow-ups
        ▼
AI reply sent back on WhatsApp  ◄── provider.sendText()
        │
        ▼
Clinic dashboard shows the lead, conversation, appointment & metrics
```

Two background cron jobs run on Vercel:
- **Follow-ups** (hourly): nudge leads who haven't booked.
- **Reminders** (every 15 min): remind patients before appointments.

---

## 7. Pricing & packaging

Simple, INR-denominated, monthly. Anchored well below the value of a single
recovered patient.

| Plan | Price | For | Limits |
| --- | --- | --- | --- |
| **Trial** | Free 14 days | Everyone at signup | Full features |
| **Starter** | ₹1,499/mo | Solo & small clinics | 1 WhatsApp number, unlimited inquiries |
| **Pro** | ₹3,499/mo | Busy multi-dentist clinics | Up to 3 numbers, multiple logins, priority support |

**Path to ₹10,000 MRR:** ~7 Starter clinics, or ~3 Pro clinics, or a small mix.
Achievable with a focused outbound push to local clinics (see GTM below).

> Billing is **manual in v1** (Razorpay payment link / UPI on trial end). This is
> deliberate — chasing automated billing before product-market fit is
> overengineering. Add Razorpay subscriptions once there are paying clinics.

---

## 8. Go-to-market (first 30 days)

The product is a means to revenue; distribution is the job.

1. **Hand-pick 30 local clinics** (your city first). Find them on Google Maps /
   Practo; note the ones already using WhatsApp.
2. **Do the setup for them.** Offer "I'll set it up free in 15 minutes on a
   call." Removing setup friction is the entire sale.
3. **Demo with their real questions.** Send a few WhatsApp messages live and let
   them watch the AI answer and book. The "wow" closes the deal.
4. **Free 14-day trial, then ₹1,499/mo.** Collect via Razorpay link. No
   contracts.
5. **Win 1 lighthouse customer → get a testimonial/video → repeat.** Local
   dentists trust other local dentists.

**Target:** 1 paying clinic in week 2–3, 7 paying clinics (₹10k+ MRR) inside 60–90 days.

---

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| WhatsApp Business API approval/onboarding friction | Support Gupshup (fast India onboarding) *and* Meta Cloud API; provide a mock provider so the product demos without API access. |
| AI says something wrong (price/medical advice) | System prompt forbids inventing prices or medical advice; "pause AI / human takeover" toggle per conversation. |
| Template-message restrictions for proactive sends | Keep follow-up/reminder copy aligned with WhatsApp utility/marketing template policy; document approved templates per provider. |
| Clinics not tech-savvy | White-glove onboarding; sensible defaults; one settings page. |
| OpenAI cost | `gpt-4o-mini`, short context window (last 12 turns), capped tokens. |

---

## 10. Why this wins

- **Channel-native**: meets Indian patients where they already are — WhatsApp.
- **ROI is obvious**: one recovered patient > a year of subscription.
- **Fast to value**: live in 15 minutes, results the same day.
- **Narrow and deep**: built only for dental clinics, so the AI and copy feel
  tailor-made, not generic.
