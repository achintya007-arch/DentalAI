# DentalFlow AI — 10-Minute Demo Script (close the first customer)

Goal: make a dentist say **"how do I get this?"** in under 10 minutes. Sell the
*outcome* (more booked patients, fewer missed messages), never the tech.

> **The single most important demo unlock:** use the **Meta WhatsApp Cloud API
> *test number*** (free, instant, no business verification). Add the dentist's
> own phone as an allowed test recipient beforehand, so they message a real
> WhatsApp number from *their own phone* and watch the AI reply live. That "wow"
> closes the deal. You do **not** need full WhatsApp approval to demo.

---

## Before the meeting (do this once, the night before)
1. App deployed and reachable (see `docs/FIRST_CUSTOMER.md`).
2. Demo clinic seeded (`npm run db:seed`) → login `demo@dentalflow.ai` / `demo12345`.
3. Settings filled with **the dentist's real clinic details** (name, 3–4 real
   treatments + prices, 2 FAQs, timings). Personalisation is what sells.
4. WhatsApp test number live; **the dentist's phone added as a test recipient.**
5. A Razorpay payment link open in another tab (₹1,499/mo). See onboarding guide.

---

## The script

**(0:00) Frame the pain — 60 sec.**
> "Doctor, when a patient messages your clinic on WhatsApp at 9 PM, who replies?
> … And how many of those never book because no one followed up? That gap is
> lost revenue. Let me show you how we close it."

**(1:00) Live WhatsApp demo — the hero moment — 3 min.**
- Ask the dentist to message the clinic WhatsApp number from their phone:
  *"Hi, how much for teeth cleaning?"*
- The AI replies in seconds with their real price and asks for name + a slot.
- Have them reply *"Ravi, tomorrow 6pm"*.
- AI confirms the booking. Pause. Let it land.
> "That just happened with zero staff effort, 24×7, in your clinic's voice."

**(4:00) Show the dashboard — 3 min.**
- Refresh **Dashboard**: inquiries / bookings / conversion rate moved.
- **Leads** → open the conversation you just had. "Every chat, captured."
- **Appointments** → the new booking is here; flip it to **Confirmed**.
- **Leads** → point to a `QUALIFIED` lead: "This patient asked but didn't book.
  DentalFlow follows up automatically on day 1, 3 and 7 — that's recovered
  revenue you're losing today."

**(7:00) Show reminders — 1 min.**
- On **Appointments**, explain the 24h + 2h reminders. (To show one *live*, you
  can trigger it on the spot — see "Demo reminders on demand" below.)
> "Reminders cut no-shows. Fewer empty chairs."

**(8:00) Price + close — 2 min.**
> "It's ₹1,499 a month. One recovered patient pays for the whole year. I'll set
> it up on your number this week — 15 minutes, I do it for you. Shall we start
> your free 14-day trial today?"
- Send the Razorpay link. **Ask for the card / UPI now**, not "think about it."

---

## Demo reminders on demand (so automations aren't invisible)
Reminders/follow-ups are time-delayed, so they won't fire during a 10-min call.
To show one firing, trigger the cron endpoint manually from a terminal:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/cron/reminders
```

Pre-seed an appointment ~2 hours out so a `HOURS_2` reminder is due, then run the
command and let the dentist see the WhatsApp reminder arrive.

---

## Objection handling (memorise)
- **"Will it say something wrong?"** → "It only uses *your* prices and FAQs, never
  gives medical advice, and you can pause it and reply yourself anytime."
- **"I already have a receptionist."** → "This handles the after-hours and the
  repetitive questions so she focuses on patients in the chair — and it never
  forgets to follow up."
- **"Is my data safe?"** → "Each clinic's data is isolated; only you see your
  patients."
- **"Let me think about it."** → "Totally — start the free trial now so you can
  watch it work on real patients this week, decide at the end. No card risk."

## Do NOT do in a demo
- Don't show code, the schema, or say "MVP/beta".
- Don't promise calendar sync, payments-in-chat, or features that don't exist.
- Don't demo follow-ups/reminders by waiting — trigger them as above.
