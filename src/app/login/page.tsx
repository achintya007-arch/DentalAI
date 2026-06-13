"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    router.push(params.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          <span className="text-2xl">🦷</span> DentalFlow <span className="text-brand-600">AI</span>
        </Link>
        <div className="card">
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your clinic dashboard.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link href="/signup" className="font-medium text-brand-600">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
