import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------------
// Razorpay webhook — the trial→paid switch. Create a Payment Link in the
// Razorpay dashboard with `notes.clinicId = <clinic id>` (or reference_id set
// to the clinic id) and point the webhook at this route with the
// `payment_link.paid` event enabled. On payment we flip the clinic to STARTER
// so a paying customer stays live without anyone touching the database.
// ----------------------------------------------------------------------------

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false; // fail closed
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract the clinic id from payment-link notes / reference_id, or from the
  // payment entity's notes as a fallback.
  const linkEntity = event?.payload?.payment_link?.entity;
  const paymentEntity = event?.payload?.payment?.entity;
  const clinicId: string | undefined =
    linkEntity?.notes?.clinicId ||
    linkEntity?.reference_id ||
    paymentEntity?.notes?.clinicId;

  if (event?.event === "payment_link.paid" || event?.event === "payment.captured") {
    if (!clinicId) {
      console.error("[billing] payment received but no clinicId in notes/reference_id");
      // 200 so Razorpay doesn't retry forever; the payment is visible in their dashboard.
      return NextResponse.json({ received: true, matched: false });
    }
    const updated = await prisma.clinic.updateMany({
      where: { id: clinicId },
      data: { plan: "STARTER", isActive: true },
    });
    console.log(`[billing] clinic ${clinicId} upgraded to STARTER (matched=${updated.count})`);
    return NextResponse.json({ received: true, matched: updated.count === 1 });
  }

  return NextResponse.json({ received: true, ignored: event?.event ?? "unknown" });
}
