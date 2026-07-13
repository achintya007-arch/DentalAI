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
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/leads/${leadId}`).then((r) => r.json()).then((d) => setLead(d.data));
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(status: LeadStatus) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChange();
    setLead((l: any) => ({ ...l, status }));
  }

  async function toggleAi() {
    const paused = !lead?.conversation?.aiPaused;
    await fetch(`/api/leads/${leadId}/ai`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused }),
    });
    setLead((l: any) => ({ ...l, conversation: { ...l.conversation, aiPaused: paused } }));
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setReplyError("");
    const res = await fetch(`/api/leads/${leadId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReplyError(data.error ?? "Could not send");
      return;
    }
    setReply("");
    load();
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

            <div className="mt-6 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Conversation</h3>
              {lead.conversation && (
                <button
                  onClick={toggleAi}
                  className={`badge ${lead.conversation.aiPaused ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"}`}
                >
                  {lead.conversation.aiPaused ? "AI paused — you're replying" : "AI active · click to take over"}
                </button>
              )}
            </div>
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
            {lead.conversation && (
              <form onSubmit={sendReply} className="mt-3">
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Reply as clinic staff…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button className="btn-primary" disabled={sending}>
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                {replyError && <p className="mt-2 text-xs text-red-600">{replyError}</p>}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
