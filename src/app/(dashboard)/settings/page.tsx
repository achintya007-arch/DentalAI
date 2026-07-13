"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

type Treatment = { name: string; priceFrom?: number };
type Faq = { q: string; a: string };

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [greeting, setGreeting] = useState("");
  const [aboutClinic, setAboutClinic] = useState("");
  const [addressText, setAddressText] = useState("");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [autoReply, setAutoReply] = useState(true);
  const [followUpsEnabled, setFollowUpsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        setWhatsappNumber(data.whatsappNumber ?? "");
        const s = data.settings;
        if (s) {
          setOwnerPhone(s.ownerPhone ?? "");
          setGreeting(s.greeting ?? "");
          setAboutClinic(s.aboutClinic ?? "");
          setAddressText(s.addressText ?? "");
          setTreatments(s.treatments ?? []);
          setFaqs(s.faqs ?? []);
          setAutoReply(s.autoReply);
          setFollowUpsEnabled(s.followUpsEnabled);
          setRemindersEnabled(s.remindersEnabled);
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappNumber,
        ownerPhone,
        greeting,
        aboutClinic,
        addressText,
        treatments,
        faqs,
        autoReply,
        followUpsEnabled,
        remindersEnabled,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <p className="text-slate-400">Loading settings…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Train your AI receptionist and control automations"
        action={
          <button className="btn-primary" onClick={save}>
            {saved ? "Saved ✓" : "Save changes"}
          </button>
        }
      />

      <section className="card mb-6">
        <h2 className="mb-4 font-semibold">WhatsApp number</h2>
        <label className="label">Business number (E.164, e.g. +919876543210)</label>
        <input className="input" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+919876543210" />
        <p className="mt-2 text-xs text-slate-500">This is the number patients message. It routes inbound chats to your clinic.</p>
        <div className="mt-4">
          <label className="label">Owner&apos;s WhatsApp (for your Monday report)</label>
          <input className="input" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+919812345678" />
          <p className="mt-2 text-xs text-slate-500">Every Monday morning we send you last week&apos;s inquiries, bookings and upcoming appointments. Leave empty to turn off.</p>
        </div>
      </section>

      <section className="card mb-6">
        <h2 className="mb-4 font-semibold">AI knowledge base</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Greeting message</label>
            <textarea className="input" rows={2} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </div>
          <div>
            <label className="label">About the clinic</label>
            <textarea className="input" rows={3} value={aboutClinic} onChange={(e) => setAboutClinic(e.target.value)} placeholder="We're a family dental clinic in Pune offering…" />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={addressText} onChange={(e) => setAddressText(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Treatments & prices</h2>
          <button className="btn-ghost text-xs" onClick={() => setTreatments([...treatments, { name: "", priceFrom: undefined }])}>+ Add</button>
        </div>
        <div className="space-y-2">
          {treatments.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder="Treatment name" value={t.name} onChange={(e) => setTreatments(treatments.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="input w-32" type="number" placeholder="₹ from" value={t.priceFrom ?? ""} onChange={(e) => setTreatments(treatments.map((x, j) => (j === i ? { ...x, priceFrom: e.target.value ? Number(e.target.value) : undefined } : x)))} />
              <button className="btn-ghost px-3" onClick={() => setTreatments(treatments.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          {treatments.length === 0 && <p className="text-sm text-slate-400">No treatments added yet.</p>}
        </div>
      </section>

      <section className="card mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">FAQs</h2>
          <button className="btn-ghost text-xs" onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>+ Add</button>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <input className="input mb-2" placeholder="Question" value={f.q} onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
              <textarea className="input" rows={2} placeholder="Answer" value={f.a} onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              <button className="btn-ghost mt-2 text-xs" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          {faqs.length === 0 && <p className="text-sm text-slate-400">No FAQs added yet.</p>}
        </div>
      </section>

      <section className="card mb-6">
        <h2 className="mb-4 font-semibold">Automations</h2>
        <div className="space-y-3">
          <Toggle label="Auto-reply to WhatsApp messages" checked={autoReply} onChange={setAutoReply} />
          <Toggle label="Follow up with un-booked leads (day 1/3/7)" checked={followUpsEnabled} onChange={setFollowUpsEnabled} />
          <Toggle label="Send appointment reminders (24h & 2h)" checked={remindersEnabled} onChange={setRemindersEnabled} />
        </div>
      </section>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={save}>{saved ? "Saved ✓" : "Save changes"}</button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}
