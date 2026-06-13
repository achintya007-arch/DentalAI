# DentalFlow AI — Clinic Onboarding Guide (white-glove, ~15 min)

You do this *for* the dentist on a call. Do not make them self-serve in v1.

---

## What you need from the clinic (collect during the demo)
- Clinic name, city, address, timings
- 3–6 treatments with "from ₹" prices
- 2–4 common FAQs (timings, walk-ins, parking, insurance…)
- Their WhatsApp Business number (the one patients message)
- Owner's email (for the login)

---

## Step-by-step

### 1. Create their account (2 min)
- Go to `/signup`. Enter clinic name, owner name, city, email, a password.
- This creates the clinic + a 14-day trial automatically.

### 2. Fill the AI knowledge base (5 min) — `/settings`
- **Greeting** in their voice.
- **About / address / timings.**
- **Treatments & prices** — add each (this is what the AI quotes).
- **FAQs** — add their real ones.
- Leave all three **automation toggles ON**.
- **WhatsApp number**: enter it in **E.164 format** → `+91XXXXXXXXXX`.
  ⚠️ This MUST exactly match the number connected in WhatsApp, including `+91`,
  or inbound messages won't route. Save.

### 3. Connect WhatsApp (5 min — the technical bit, you do it)
**Fastest path to start: Meta WhatsApp Cloud API.**
1. In Meta for Developers → your WhatsApp app → **Configuration**:
   - **Callback URL:** `https://<your-app>/api/whatsapp/webhook`
   - **Verify token:** the value of `META_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to the **messages** field.
2. Set these env vars on the deployment for this clinic's number:
   `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`, `META_APP_SECRET`,
   `WHATSAPP_PROVIDER=meta`.
3. (Demo stage) Add the dentist's personal phone as a **test recipient** so they
   can message immediately without full business verification.

> **India alternative:** Gupshup onboards fast. Set `WHATSAPP_PROVIDER=gupshup`
> plus `GUPSHUP_API_KEY`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`,
> `GUPSHUP_WEBHOOK_SECRET`, and point Gupshup's inbound callback at the same URL.

### 4. Smoke test (2 min)
- Message the clinic number: *"hi, how much for cleaning?"*
- Confirm: AI replies → a **Lead** appears → giving name + time creates an
  **Appointment**. Done — they're live.

### 5. Collect payment (see below)

---

## Collecting money tomorrow (NO code needed)
You do **not** need in-app billing to charge your first customers. Use a
**Razorpay Payment Link** (or UPI):
1. Razorpay Dashboard → **Payment Links** → create a recurring/one-time link for
   **₹1,499/month** (label "DentalFlow AI — Starter").
2. Send the link on WhatsApp/email at the end of the demo. Ask them to pay now to
   start the trial-to-paid.
3. When paid, mark them as a customer. (Plan enforcement exists in code; for the
   first handful of clinics, manage status manually.)

This is deliberately manual — chasing automated subscriptions before you have
paying clinics is the wrong order.

---

## Onboarding gotchas (avoid these)
- **WhatsApp number mismatch** → most common failure. Must be exact E.164 and
  match the connected number.
- **`ALLOW_MOCK_WEBHOOK`** must be unset once a real provider is connected.
- **Trial expiry**: after 14 days the AI stops replying for unpaid clinics (by
  design). Convert them before then.
