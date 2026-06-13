"use client";

import { useEffect, useState, useCallback } from "react";
import { ApptBadge, PageHeader } from "@/components/ui";
import type { Appointment, AppointmentStatus } from "@prisma/client";

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    const { data } = await res.json();
    setAppts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Bookings captured by AI and added manually"
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New appointment
          </button>
        }
      />

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : appts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No appointments yet.</td></tr>
            ) : (
              appts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.patientName}</div>
                    <div className="text-slate-500">{a.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.treatment ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(a.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}
                  </td>
                  <td className="px-4 py-3"><ApptBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-slate-200 px-2 py-1 text-xs"
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                    >
                      {["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && <NewAppointmentModal onClose={() => setShowForm(false)} onCreated={load} />}
    </div>
  );
}

function NewAppointmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ patientName: "", phone: "", treatment: "", scheduledAt: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save. Check the fields and try again.");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">New appointment</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="label">Patient name</label>
            <input className="input" required value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone (with +91)</label>
            <input className="input" required placeholder="+919876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Treatment</label>
            <input className="input" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
          </div>
          <div>
            <label className="label">Date & time</label>
            <input className="input" type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
