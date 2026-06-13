import { NextResponse } from "next/server";
import { processReminders } from "@/lib/automations";
import { isAuthorizedCron } from "@/lib/cron";

// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  const sent = await processReminders();
  return NextResponse.json({ ok: true, sent });
}
