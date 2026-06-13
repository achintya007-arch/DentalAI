import { clsx } from "clsx";
import type { LeadStatus, AppointmentStatus } from "@prisma/client";

// Small presentational helpers shared across dashboard pages.

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

const LEAD_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  ENGAGED: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-amber-100 text-amber-700",
  BOOKED: "bg-brand-100 text-brand-700",
  LOST: "bg-red-100 text-red-700",
};

export function LeadBadge({ status }: { status: LeadStatus }) {
  return <span className={clsx("badge", LEAD_COLORS[status])}>{status}</span>;
}

const APPT_COLORS: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

export function ApptBadge({ status }: { status: AppointmentStatus }) {
  return <span className={clsx("badge", APPT_COLORS[status])}>{status.replace("_", " ")}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
