"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ clinicName: "", name: "", email: "", password: "", city: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create account");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          <span className="text-2xl">🦷</span> DentalFlow <span className="text-brand-600">AI</span>
        </Link>
        <div className="card">
          <h1 className="text-xl font-bold">Start your free trial</h1>
          <p className="mt-1 text-sm text-slate-500">14 days free. No card required.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Clinic name</label>
              <input className="input" required value={form.clinicName} onChange={set("clinicName")} placeholder="Smile Dental Clinic" />
            </div>
            <div>
              <label className="label">Your name</label>
              <input className="input" required value={form.name} onChange={set("name")} placeholder="Dr. Ravi Kumar" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={set("city")} placeholder="Pune" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={form.email} onChange={set("email")} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
