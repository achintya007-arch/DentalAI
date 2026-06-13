import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.clinicId },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar clinicName={clinic?.name ?? "My Clinic"} email={session.email} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
