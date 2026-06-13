import { NextResponse } from "next/server";
import { processReminders } from "@/lib/automations";

// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET.
function authorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return new NextResponse("Unauthorized", { status: 401 });
  const sent = await processReminders();
  return NextResponse.json({ ok: true, sent });
}
