# DentalFlow AI — Page Wireframes

Low-fidelity ASCII wireframes for every page in the MVP. They map 1:1 to the
implemented routes. Visual style: clean, white, single emerald accent
(`brand-600`), generous spacing, mobile-responsive.

Pages: **Landing · Login · Signup · Dashboard · Leads · Appointments · Settings**

---

## 1. Landing page (`/`)

Purpose: convert a clinic owner into a free-trial signup. Single, focused CTA.

```
┌──────────────────────────────────────────────────────────────┐
│ 🦷 DentalFlow AI                          [Log in] [Start free]│
├──────────────────────────────────────────────────────────────┤
│                  • Built for Indian dental clinics 🇮🇳 •        │
│                                                                │
│        Your clinic's WhatsApp, answered INSTANTLY —            │
│                     even at 2 AM.                              │
│                                                                │
│   AI receptionist that replies, books, reminds & follows up.  │
│                                                                │
│            [ Start 14-day free trial ]  [ See how ]           │
│            No credit card · Setup in 15 minutes               │
│                                                                │
│        ┌────────────────────────────────────────┐            │
│        │ 🟢 WhatsApp · Smile Dental Clinic        │  chat      │
│        │  Patient: do you do teeth cleaning?      │  mockup    │
│        │  AI: Yes! from ₹500. May I have your name│            │
│        │  Patient: Ravi. Tomorrow evening.        │            │
│        │  AI: Booked tomorrow 6 PM. See you! 🦷    │            │
│        └────────────────────────────────────────┘            │
├──────────────────────────────────────────────────────────────┤
│   PROBLEM: Every missed WhatsApp is lost revenue              │
│   [ 63% msg first ] [ 40% unanswered ] [ ₹15k+ per patient ]  │
├──────────────────────────────────────────────────────────────┤
│   FEATURES (2×2 grid)                                          │
│   💬 AI Receptionist     📅 Books appointments                 │
│   🔁 Never loses a lead   ⏰ Cuts no-shows                      │
├──────────────────────────────────────────────────────────────┤
│   HOW IT WORKS:  ① Connect WhatsApp ② Train AI ③ Get bookings │
├──────────────────────────────────────────────────────────────┤
│   PRICING:   [ Starter ₹1,499/mo ]   [ Pro ₹3,499/mo ★ ]      │
├──────────────────────────────────────────────────────────────┤
│   CTA band:  "Stop losing patients"  [ Start free trial ]    │
│   Footer · © DentalFlow AI · Made in India                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Login (`/login`)

```
┌─────────────────────────────┐
│         🦷 DentalFlow AI      │
│   ┌───────────────────────┐  │
│   │ Welcome back          │  │
│   │ Log in to your clinic │  │
│   │                       │  │
│   │ Email   [__________]  │  │
│   │ Password[__________]  │  │
│   │ (error message, red)  │  │
│   │ [     Log in      ]   │  │
│   └───────────────────────┘  │
│   New here? Create an account│
└─────────────────────────────┘
```

---

## 3. Signup (`/signup`)

Creates the clinic + owner in one step. Minimal fields to reduce friction.

```
┌─────────────────────────────┐
│         🦷 DentalFlow AI      │
│   ┌───────────────────────┐  │
│   │ Start your free trial │  │
│   │ 14 days free. No card.│  │
│   │ Clinic name [_______] │  │
│   │ Your name   [_______] │  │
│   │ City        [_______] │  │
│   │ Email       [_______] │  │
│   │ Password    [_______] │  │
│   │ [   Create account  ] │  │
│   └───────────────────────┘  │
│   Already have one? Log in   │
└─────────────────────────────┘
```

---

## Dashboard shell (applies to pages 4–7)

```
┌──────────┬───────────────────────────────────────────────────┐
│ 🦷 Dental │  <page content>                                   │
│          │                                                    │
│ 📊 Dash   │                                                    │
│ 👥 Leads  │                                                    │
│ 📅 Appts  │                                                    │
│ ⚙️ Settings│                                                   │
│          │                                                    │
│ ────────  │                                                    │
│ Clinic    │                                                    │
│ email     │                                                    │
│ [Log out] │                                                    │
└──────────┴───────────────────────────────────────────────────┘
```

---

## 4. Dashboard (`/dashboard`)

```
│  Dashboard                                       Last 30 days  │
│                                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Total   │ │ Appts   │ │ Convers.│ │ Pending │              │
│  │ inquir. │ │ booked  │ │ rate    │ │ follow- │              │
│  │   128   │ │   41    │ │  32%    │ │ ups  17 │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                │
│  ┌─ Upcoming appointments ─┐ ┌─ Recent leads ──────────────┐  │
│  │ Ravi    Cleaning  6 PM  │ │ Priya   +9198…   Braces      │  │
│  │ Sneha   Root canal 11 AM│ │ Amit    +9197…   Whitening   │  │
│  │ …                       │ │ …                            │  │
│  └─────────────────────────┘ └──────────────────────────────┘ │
```

---

## 5. Leads (`/leads`)

List + status filters + search. Clicking a row opens the conversation drawer.

```
│  Leads                       Every patient who reached out     │
│  [ALL][NEW][ENGAGED][QUALIFIED][BOOKED][LOST]   [search 🔍___] │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Name      Phone        Treatment   Status     Last      │   │
│  │ Ravi K.   +9198…       Cleaning    [BOOKED]   12 Jun    │   │
│  │ Priya S.  +9198…       Braces      [QUALIF.]  12 Jun    │   │
│  │ Amit      +9197…       Whitening   [ENGAGED]  11 Jun    │   │
│  └────────────────────────────────────────────────────────┘   │
                                                  │ click row
                                                  ▼
        ┌──── Lead drawer (slides from right) ──────────┐
        │ Ravi Kumar                              [✕]   │
        │ +919876543210                                 │
        │ [NEW][QUALIFIED][BOOKED][LOST]  ← set status  │
        │ Interested in: Teeth Cleaning                 │
        │ ── Conversation ──────────────────────────    │
        │  Patient: do you do teeth cleaning?           │
        │      AI: Yes! from ₹500. Book? Name pls       │
        │  Patient: Ravi. Tomorrow evening.             │
        │      AI: Booked tomorrow 6 PM. 🦷              │
        └───────────────────────────────────────────────┘
```

---

## 6. Appointments (`/appointments`)

```
│  Appointments                    [ + New appointment ]         │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Patient    Treatment   When         Status    Action    │   │
│  │ Ravi K.    Cleaning    14 Jun 6 PM  [CONFIRM] [status▾] │   │
│  │ +9198…                                                   │   │
│  │ Sneha P.   Root canal  15 Jun 11 AM [REQUEST] [status▾] │   │
│  └────────────────────────────────────────────────────────┘   │

   New-appointment modal:
   ┌────────────────────────────┐
   │ New appointment            │
   │ Patient name [__________]  │
   │ Phone (+91)  [__________]  │
   │ Treatment    [__________]  │
   │ Date & time  [datetime  ]  │
   │        [Cancel] [Create]   │
   └────────────────────────────┘
```

---

## 7. Settings (`/settings`)

The single screen where the clinic "trains" its AI receptionist.

```
│  Settings                                   [ Save changes ]   │
│                                                                │
│  ┌─ WhatsApp number ────────────────────────────────────┐    │
│  │ Business number (E.164) [ +919876543210 ]            │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─ AI knowledge base ──────────────────────────────────┐    │
│  │ Greeting        [textarea........................]    │    │
│  │ About the clinic[textarea........................]    │    │
│  │ Address         [______________________________]     │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─ Treatments & prices ───────────────────[+ Add]─────┐    │
│  │ [Teeth Cleaning......] [₹ 500 ] [✕]                  │    │
│  │ [Root Canal..........] [₹3000 ] [✕]                  │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─ FAQs ──────────────────────────────────[+ Add]─────┐    │
│  │ Q [What are your timings?...................]        │    │
│  │ A [Mon–Sat, 10am–7pm........................]        │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─ Automations ────────────────────────────────────────┐    │
│  │ Auto-reply to WhatsApp           [ ●━ on ]           │    │
│  │ Follow up un-booked leads (1/3/7)[ ●━ on ]           │    │
│  │ Send reminders (24h & 2h)        [ ●━ on ]           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                          [ Save changes ]      │
```

---

## Responsive behaviour

- **Mobile (< 640px):** the sidebar collapses; stat cards stack to a single
  column; tables scroll horizontally; drawer/modal go full-width.
- **Tablet/desktop:** layout as drawn above.

All screens use the shared primitives — `.card`, `.btn-primary`, `.input`,
`.badge` — so the look stays consistent without a component library.
