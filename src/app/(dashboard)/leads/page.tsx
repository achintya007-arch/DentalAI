"use client";

import { useEffect, useState, useCallback } from "react";
import { LeadBadge, PageHeader } from "@/components/ui";
import type { Lead, LeadStatus } from "@prisma/client";

type LeadRow = Lead & { _count?: { appointments: number } };

const STATUS_FILTERS: (LeadStatus | "ALL")[] = ["ALL", "NEW", "ENGAGED", "QUALIFIED", "BOOKED", "LOST"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (q) params.set("q", q);
    const res = await fetch(`/api/leads?${params}`);
    const { data } = await res.json();
    setLeads(data ?? []);
    setLoading(false);
  }, [filter, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Leads" subtitle="Every patient who reached out" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`badge ${filter === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {s}
          </button>
        ))}
        <input
          className="input ml-auto max-w-xs"
          placeholder="Search name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Treatment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No leads found.</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(l.id)}>
                  <td className="px-4 py-3 font-medium">{l.name ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-slate-600">{l.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{l.treatmentInterest ?? "—"}</td>
                  <td className="px-4 py-3"><LeadBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-slate-500">
                    {l.lastContactAt ? new Date(l.lastContactAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && <LeadDrawer leadId={selected} onClose={() => setSelected(null)} onChange={load} />}
    </div>
  );
}

function LeadDrawer({ leadId, onClose, onChange }: { leadId: string; onClose: () => void; onChange: () => void }) {
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/leads/${leadId}`).then((r) => r.json()).then((d) => setLead(d.data));
  }, [leadId]);

  async function setStatus(status: LeadStatus) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChange();
    setLead((l: any) => ({ ...l, status }));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {!lead ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{lead.name ?? "Unknown"}</h2>
                <p className="text-sm text-slate-500">{lead.phone}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["NEW", "QUALIFIED", "BOOKED", "LOST"] as LeadStatus[]).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`badge ${lead.status === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {s}
                </button>
              ))}
            </div>

            {lead.treatmentInterest && (
              <p className="mt-4 text-sm"><span className="text-slate-500">Interested in:</span> {lead.treatmentInterest}</p>
            )}

            <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Conversation</h3>
            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              {lead.conversation?.messages?.length ? (
                lead.conversation.messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.direction === "OUTBOUND" ? "bg-brand-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>
                      {m.body}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No messages yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
