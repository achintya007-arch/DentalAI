# DentalFlow AI — First Customer Playbook

One job: **deploy → demo → collect ₹1,499.** No features, no scale. This file is
the runbook.

---

## FIRST CUSTOMER CHECKLIST

```
DEPLOY & CONFIGURE
□ Deploy app                 → push to GitHub, import to Vercel
□ Configure database         → Neon/Supabase Postgres, pooled DATABASE_URL
□ Configure environment vars → see list below
□ Run schema + seed          → prisma db push  +  npm run db:seed
□ Create demo clinic         → seeded (demo@dentalflow.ai / demo12345)

VALIDATE (15 min click-through on the live URL)
□ Test signup                → create a throwaway clinic
□ Test login                 → log in, land on dashboard
□ Test dashboard             → metrics + empty states render
□ Test lead capture          → POST a mock inbound, lead appears
□ Test WhatsApp flow         → message → AI reply → conversation saved
□ Test appointment creation  → AI booking + manual "New appointment"
□ Test follow-ups            → un-booked lead schedules day 1/3/7 (DB)
□ Test reminders             → booking schedules 24h/2h; trigger cron to verify

SELL
□ Create payment collection flow → Razorpay payment link ₹1,499/mo (manual)
□ Create onboarding guide        → docs/ONBOARDING.md (done)
□ Create demo script             → docs/DEMO_SCRIPT.md (done)
□ Ready to pitch                 → book 5 local clinic meetings
```

### Required environment variables (Vercel)
```
DATABASE_URL            pooled Postgres URL (?sslmode=require)
AUTH_SECRET             openssl rand -base64 32   (>=32 chars)
OPENAI_API_KEY          sk-...
OPENAI_MODEL            gpt-4o-mini
CRON_SECRET             openssl rand -base64 32
NEXT_PUBLIC_APP_URL     https://<your-app>
WHATSAPP_PROVIDER       meta   (or gupshup; "mock" only for a no-WhatsApp demo)
META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID / META_APP_SECRET / META_WEBHOOK_VERIFY_TOKEN
# For a deployed demo WITHOUT a real WhatsApp number: WHATSAPP_PROVIDER=mock and ALLOW_MOCK_WEBHOOK=true
```

### Two deploy gotchas (known)
- **Mock webhook in production** is rejected unless `ALLOW_MOCK_WEBHOOK=true`.
  Use it only for a no-WhatsApp demo; turn it OFF for real clinics.
- **Cron `*/15` needs Vercel Pro.** On Hobby, cron runs at most daily — fine for
  early customers; trigger reminders/follow-ups manually with `CRON_SECRET` when
  you need them on time.

---

## 72-HOUR PLAN TO FIRST CUSTOMER

### Day 1 — DEPLOY (get a live URL + a working WhatsApp test number)
- Create Postgres (Neon), copy pooled `DATABASE_URL`.
- Import repo to Vercel, set all env vars, deploy.
- `prisma db push` + `npm run db:seed`.
- Spin up the **Meta Cloud API test number**; set `WHATSAPP_PROVIDER=meta` +
  Meta env; point the webhook at `/api/whatsapp/webhook`; add YOUR phone as a
  test recipient and confirm an end-to-end AI reply.
- Create the **Razorpay ₹1,499 payment link**.

### Day 2 — VALIDATE (make it demo-proof) + line up meetings
- Run the full **First Customer Checklist** validate block on the live URL.
- Pre-fill Settings with a **real target clinic's** details.
- Trigger the reminder cron manually and confirm a WhatsApp reminder arrives.
- **Book 5 meetings**: walk into / call 15–20 local clinics, offer a free 10-min
  WhatsApp demo + free setup. Aim for 5 yeses.
- Rehearse `docs/DEMO_SCRIPT.md` twice end-to-end.

### Day 3 — SELL & ONBOARD
- Run the live demo (dentist messages from their own phone).
- Close on the spot: send the Razorpay link, **ask for payment now**, start the
  trial-to-paid.
- White-glove onboard the first "yes" using `docs/ONBOARDING.md`: their number,
  their treatments/FAQs, smoke test, done.
- Repeat the demo with the other 4. One paying clinic in 72 hours is the target;
  ₹10,000 MRR is ~7 of them.

---

## What is NOT needed for the first customer (resist the urge)
In-app subscription billing, calendar/availability engine, multi-number support,
RLS, analytics, mobile app, more languages. None of these stand between you and
the first ₹1,499. Ship the demo, collect the money, *then* revisit the audit
backlog.
