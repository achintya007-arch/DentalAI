export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";

// GET /api/dashboard/stats?days=30  -> headline metrics for the dashboard
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const clinicId = session.clinicId;

    const [totalInquiries, booked, pendingFollowUps, upcoming, statusCounts] = await Promise.all([
      prisma.lead.count({ where: { clinicId, createdAt: { gte: since } } }),
      prisma.appointment.count({ where: { clinicId, createdAt: { gte: since } } }),
      prisma.followUp.count({ where: { clinicId, status: "PENDING" } }),
      prisma.appointment.count({
        where: { clinicId, scheduledAt: { gte: new Date() }, status: { in: ["REQUESTED", "CONFIRMED"] } },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { clinicId, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    const conversionRate = totalInquiries > 0 ? Math.round((booked / totalInquiries) * 100) : 0;

    const funnel = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

    return ok({
      totalInquiries,
      appointmentsBooked: booked,
      conversionRate,
      pendingFollowUps,
      upcomingAppointments: upcoming,
      funnel,
      windowDays: days,
    });
  } catch (err) {
    return handleError(err);
  }
}