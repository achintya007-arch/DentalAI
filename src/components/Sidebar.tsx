"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/appointments", label: "Appointments", icon: "📅" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ clinicName, email }: { clinicName: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5 text-lg font-bold">
        <span className="text-2xl">🦷</span> DentalFlow
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 text-sm">
        <div className="font-medium text-slate-800">{clinicName}</div>
        <div className="truncate text-slate-500">{email}</div>
        <button onClick={logout} className="btn-ghost mt-3 w-full text-xs">
          Log out
        </button>
      </div>
    </aside>
  );
}
