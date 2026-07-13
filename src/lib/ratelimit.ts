import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------------
// DB-backed fixed-window rate limiter. Deliberately boring: an in-memory
// limiter is useless on serverless (every invocation is a fresh instance), and
// Redis is an extra service we don't need at this scale. One small table gives
// correct-enough limiting across all instances.
// ----------------------------------------------------------------------------

export type RateLimitDecision = { allowed: boolean; remaining: number };

/** Pure decision logic, extracted for testing. */
export function bucketDecision(
  bucket: { windowStart: Date; count: number } | null,
  now: Date,
  max: number,
  windowMs: number
): { allowed: boolean; reset: boolean; remaining: number } {
  if (!bucket || now.getTime() - bucket.windowStart.getTime() >= windowMs) {
    return { allowed: true, reset: true, remaining: max - 1 };
  }
  if (bucket.count >= max) return { allowed: false, reset: false, remaining: 0 };
  return { allowed: true, reset: false, remaining: max - bucket.count - 1 };
}

/**
 * Consume one unit from the bucket for `key`. Returns whether the request is
 * allowed. Fails OPEN on database errors — availability of login beats perfect
 * limiting.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now = new Date()
): Promise<RateLimitDecision> {
  try {
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });
    const decision = bucketDecision(bucket, now, max, windowMs);

    if (decision.reset) {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        update: { windowStart: now, count: 1 },
        create: { key, windowStart: now, count: 1 },
      });
    } else if (decision.allowed) {
      await prisma.rateLimitBucket.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
    }
    return { allowed: decision.allowed, remaining: decision.remaining };
  } catch (err) {
    console.error("[ratelimit] check failed, allowing request", err);
    return { allowed: true, remaining: 0 };
  }
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
