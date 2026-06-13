import { NextResponse } from "next/server";
import { processFollowUps } from "@/lib/automations";
import { isAuthorizedCron } from "@/lib/cron";

// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET so it
// can't be invoked by random traffic.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  const sent = await processFollowUps();
  return NextResponse.json({ ok: true, sent });
}
