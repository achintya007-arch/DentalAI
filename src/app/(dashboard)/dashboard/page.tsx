import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard, PageHeader, ApptBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const clinicId = session.clinicId;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalInquiries, booked, pendingFollowUps, upcoming, recent] = await Promise.all([
    prisma.lead.count({ where: { clinicId, createdAt: { gte: since } } }),
    prisma.appointment.count({ where: { clinicId, createdAt: { gte: since } } }),
    prisma.followUp.count({ where: { clinicId, status: "PENDING" } }),
    prisma.appointment.findMany({
      where: { clinicId, scheduledAt: { gte: new Date() }, status: { in: ["REQUESTED", "CONFIRMED"] } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.lead.findMany({ where: { clinicId }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  const conversionRate = totalInquiries > 0 ? Math.round((booked / totalInquiries) * 100) : 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Last 30 days" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total inquiries" value={totalInquiries} hint="WhatsApp + manual" />
        <StatCard label="Appointments booked" value={booked} />
        <StatCard label="Conversion rate" value={`${conversionRate}%`} hint="inquiries → bookings" />
        <StatCard label="Pending follow-ups" value={pendingFollowUps} hint="queued to send" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Upcoming appointments</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming appointments yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{a.patientName}</div>
                    <div className="text-slate-500">{a.treatment ?? "General"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-700">
                      {a.scheduledAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}
                    </div>
                    <ApptBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Recent leads</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">No leads yet. Connect WhatsApp to start.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{l.name ?? "Unknown"}</div>
                    <div className="text-slate-500">{l.phone}</div>
                  </div>
                  <span className="text-slate-400">{l.treatmentInterest ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
