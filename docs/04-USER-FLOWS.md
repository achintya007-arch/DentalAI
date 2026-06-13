# DentalFlow AI — User Flows

The journeys that matter for revenue. Two audiences: the **patient** (on
WhatsApp, never sees the app) and the **clinic** (owner + receptionist, live in
the dashboard).

---

## Flow A — Patient inquiry → booking (the money flow)

```
Patient sends WhatsApp message to clinic number
        │
        ▼
Provider webhook → POST /api/whatsapp/webhook
        │
        ▼
Route to Clinic by destination number
        │
   ┌────┴─────────────────────────────┐
   │ New phone?                        │
   │  yes → create Lead (NEW→ENGAGED)  │
   │  no  → load existing Lead         │
   └────┬─────────────────────────────┘
        ▼
Store inbound message; load last 12 turns + clinic context
        │
        ▼
OpenAI receptionist generates reply + extracts {name, treatment, slot}
        │
   ┌────┴──────────────────────────────────────────┐
   │ readyToBook (name + concrete slot)?            │
   │  YES → create Appointment (REQUESTED)          │
   │        Lead → BOOKED                            │
   │        cancel pending follow-ups               │
   │        schedule 24h + 2h reminders             │
   │  NO  → Lead → QUALIFIED (if info captured)     │
   │        ensure day 1/3/7 follow-ups scheduled   │
   └────┬──────────────────────────────────────────┘
        ▼
Send AI reply on WhatsApp; store outbound message
        │
        ▼
Appears live in clinic dashboard (Leads + Appointments + stats)
```

**Key UX guarantees:** every message gets a reply in seconds, 24×7; no patient
is ever dropped; the clinic sees everything without lifting a finger.

---

## Flow B — Follow-up automation (un-booked lead)

```
Lead created/engaged but not booked
        │
        ▼
scheduleFollowUps() upserts DAY_1, DAY_3, DAY_7 (PENDING)
        │
        ▼
Vercel Cron (hourly) → GET /api/cron/followups
        │
        ▼
For each PENDING follow-up where scheduledFor ≤ now:
   ┌─ Lead already BOOKED/LOST? → CANCEL ───────────┐
   │ else → send stage message on WhatsApp          │
   │        mark SENT                                │
   │        DAY_7 sent → Lead → LOST                 │
   └────────────────────────────────────────────────┘
        │
        ▼
If the patient replies at any point → Flow A resumes,
follow-ups auto-cancelled on booking.
```

Stage copy escalates gently: day 1 "just checking in", day 3 "slots opening
this week", day 7 "last reminder". (See `lib/automations.ts`.)

---

## Flow C — Appointment reminders (reduce no-shows)

```
Appointment confirmed (by AI or staff)
        │
        ▼
scheduleReminders() upserts HOURS_24 + HOURS_2 (PENDING)
   (skips any reminder time already in the past)
        │
        ▼
Vercel Cron (every 15 min) → GET /api/cron/reminders
        │
        ▼
For each PENDING reminder where scheduledFor ≤ now:
   ┌─ Appt CANCELLED/NO_SHOW/COMPLETED? → CANCEL ───┐
   │ else → send reminder on WhatsApp, mark SENT    │
   └────────────────────────────────────────────────┘
        │
        ▼
Patient replies CONFIRM / RESCHEDULE → Flow A handles it
```

Rescheduling an appointment re-runs `scheduleReminders()`; cancelling it cancels
pending reminders.

---

## Flow D — Clinic onboarding (signup → live)

```
Owner lands on / → clicks "Start free trial"
        │
        ▼
/signup form (clinic name, name, city, email, password)
        │
        ▼
POST /api/auth/signup
   → create Clinic + default ClinicSettings + OWNER user (txn)
   → start 14-day trial, set session cookie
        │
        ▼
Redirect to /dashboard (empty state, prompts to connect WhatsApp)
        │
        ▼
/settings: enter WhatsApp number, treatments, prices, FAQs, greeting
        │
        ▼
Connect provider webhook to /api/whatsapp/webhook (white-glove during sales)
        │
        ▼
First test message → AI replies → clinic is live ✅
```

Target: **under 15 minutes**, done together on the sales call.

---

## Flow E — Receptionist daily use

```
Log in → /dashboard
        │
        ├─ Glance at metrics (inquiries, bookings, conversion, pending follow-ups)
        │
        ├─ /leads
        │     filter by status / search by name or phone
        │     open a lead → read AI conversation
        │     take over if needed (set status, add notes)
        │
        ├─ /appointments
        │     see today's & upcoming bookings
        │     confirm REQUESTED → CONFIRMED
        │     mark COMPLETED / NO_SHOW / CANCELLED
        │     add a walk-in/phone booking via "New appointment"
        │
        └─ Log out
```

---

## Flow F — Human takeover (edge case)

```
Conversation needs a human (complex case, complaint, VIP)
        │
        ▼
Staff sets Conversation.aiPaused = true (planned UI control; field exists in v1)
        │
        ▼
Inbound messages are still stored, but the AI does NOT auto-reply
        │
        ▼
Staff replies manually (recorded as sender = HUMAN)
        │
        ▼
Un-pause to hand the thread back to the AI
```

> v1 ships the data model and webhook short-circuit for this (`aiPaused`); the
> in-dashboard toggle is an early fast-follow.

---

## State machines

**Lead status:**
```
NEW ──► ENGAGED ──► QUALIFIED ──► BOOKED
                         │
                         └────► LOST   (after DAY_7 follow-up, no booking)
```

**Appointment status:**
```
REQUESTED ──► CONFIRMED ──► COMPLETED
     │             │
     └─────────────┴────► CANCELLED / NO_SHOW
```

**Automation status (FollowUp & Reminder):**
```
PENDING ──► SENT
   │
   └──► CANCELLED   (lead booked / appt cancelled)
   └──► FAILED      (provider send error; retried next cron run)
```
