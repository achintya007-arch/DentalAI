import { NextResponse } from "next/server";
import { processWeeklyReports } from "@/lib/automations";
import { isAuthorizedCron } from "@/lib/cron";

// Monday-morning owner report (see vercel.json). Protected by CRON_SECRET.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  const sent = await processWeeklyReports();
  return NextResponse.json({ ok: true, sent });
}
