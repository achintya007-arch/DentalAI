import Link from "next/link";

const features = [
  {
    title: "AI WhatsApp Receptionist",
    body: "Replies to every patient in seconds, 24×7. Answers FAQs about timings, prices and treatments in English & Hinglish.",
    icon: "💬",
  },
  {
    title: "Books Appointments Automatically",
    body: "Captures name, phone, treatment and preferred slot — then creates the appointment without your receptionist lifting a finger.",
    icon: "📅",
  },
  {
    title: "Never Loses a Lead",
    body: "Patient didn't book? We follow up on day 1, 3 and 7 automatically — turning cold chats into paying patients.",
    icon: "🔁",
  },
  {
    title: "Cuts No-Shows",
    body: "Automatic reminders 24 hours and 2 hours before every appointment. Fewer empty chairs, more revenue.",
    icon: "⏰",
  },
];

const steps = [
  { n: 1, t: "Connect WhatsApp", d: "Link your clinic's WhatsApp number in 10 minutes. No coding." },
  { n: 2, t: "Train your AI", d: "Add your treatments, prices and FAQs once. The AI handles the rest." },
  { n: 3, t: "Watch bookings roll in", d: "Patients chat, the AI books, you see everything in one dashboard." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">🦷</span> DentalFlow <span className="text-brand-600">AI</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Start free trial
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <span className="badge bg-brand-100 text-brand-700">Built for Indian dental clinics 🇮🇳</span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Your clinic&apos;s WhatsApp, answered{" "}
          <span className="text-brand-600">instantly</span> — even at 2 AM.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          DentalFlow AI is an AI receptionist that replies to every WhatsApp inquiry, books
          appointments, sends reminders and follows up with patients — so you stop losing revenue to
          missed messages.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">
            Start 14-day free trial
          </Link>
          <a href="#how" className="btn-ghost px-6 py-3 text-base">
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">No credit card needed · Setup in 15 minutes</p>

        {/* Chat mock */}
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-500" /> WhatsApp · Smile Dental Clinic
          </div>
          <div className="space-y-2 text-sm">
            <Bubble who="them">Hi, do you do teeth cleaning? How much?</Bubble>
            <Bubble who="us">
              Hi! 😊 Yes, we offer professional teeth cleaning from ₹500. Would you like to book a
              visit? May I have your name and a preferred day?
            </Bubble>
            <Bubble who="them">Ravi. Tomorrow evening works.</Bubble>
            <Bubble who="us">
              Perfect, Ravi! I&apos;ve booked you for tomorrow at 6 PM. You&apos;ll get a reminder before your
              visit. See you! 🦷
            </Bubble>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Every missed WhatsApp is lost revenue</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["63%", "of patients message on WhatsApp before calling"],
              ["~40%", "of inquiries go unanswered after clinic hours"],
              ["₹15k+", "average value of a single converted patient"],
            ].map(([stat, label]) => (
              <div key={label} className="card">
                <div className="text-3xl font-extrabold text-brand-600">{stat}</div>
                <p className="mt-2 text-sm text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          One AI that does the work of a full-time receptionist
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="card flex gap-4">
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Live in 15 minutes</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="card text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Simple pricing for clinics</h2>
        <p className="mt-2 text-center text-slate-600">Less than the cost of one missed patient a month.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <PricingCard
            name="Starter"
            price="₹1,499"
            period="/month"
            tagline="For solo & small clinics"
            features={["AI WhatsApp receptionist", "Unlimited inquiries", "Auto booking & reminders", "Day 1/3/7 follow-ups", "1 WhatsApp number"]}
          />
          <PricingCard
            name="Pro"
            price="₹3,499"
            period="/month"
            tagline="For busy multi-dentist clinics"
            highlight
            features={["Everything in Starter", "Up to 3 WhatsApp numbers", "Multiple receptionist logins", "Priority support", "Custom AI training"]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold">Stop losing patients to missed messages</h2>
          <p className="mt-3 text-brand-50">Start your free 14-day trial today. Cancel anytime.</p>
          <Link href="/signup" className="btn mt-6 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
            Start free trial
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} DentalFlow AI · Made in India for Indian clinics
      </footer>
    </main>
  );
}

function Bubble({ who, children }: { who: "us" | "them"; children: React.ReactNode }) {
  const us = who === "us";
  return (
    <div className={`flex ${us ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          us ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  tagline,
  features,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div className={`card ${highlight ? "ring-2 ring-brand-500" : ""}`}>
      {highlight && <span className="badge bg-brand-100 text-brand-700">Most popular</span>}
      <h3 className="mt-2 text-xl font-bold">{name}</h3>
      <p className="text-sm text-slate-500">{tagline}</p>
      <div className="mt-4">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-slate-500">{period}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-brand-600">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link href="/signup" className="btn-primary mt-6 w-full">
        Start free trial
      </Link>
    </div>
  );
}
