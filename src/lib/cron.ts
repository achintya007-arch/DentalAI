import crypto from "node:crypto";

// Constant-time check that a request carries the Vercel Cron secret. Using a
// timing-safe compare avoids leaking the secret one byte at a time.
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed
  const provided = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
