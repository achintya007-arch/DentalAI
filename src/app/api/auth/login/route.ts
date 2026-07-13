import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";

// A valid bcrypt hash of a random string, used to equalize timing when the
// supplied email has no account (prevents user enumeration via timing).
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvHO0qY3T0bJ4Qn9p1m1Z2eY1q3Aa";

const WINDOW_15_MIN = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());

    // Brute-force protection: per-IP and per-account fixed windows.
    const ip = clientIp(req);
    const [byIp, byEmail] = await Promise.all([
      checkRateLimit(`login:ip:${ip}`, 20, WINDOW_15_MIN),
      checkRateLimit(`login:email:${body.email.toLowerCase()}`, 10, WINDOW_15_MIN),
    ]);
    if (!byIp.allowed || !byEmail.allowed) {
      return fail("Too many login attempts. Try again in 15 minutes.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });

    // Always run a bcrypt comparison, even when the user doesn't exist, so the
    // response time can't be used to enumerate which emails have accounts.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const valid = await verifyPassword(body.password, hash);
    if (!user || !valid) return fail("Invalid email or password", 401);

    await createSession({
      userId: user.id,
      clinicId: user.clinicId,
      role: user.role,
      email: user.email,
    });

    return ok({ clinicId: user.clinicId });
  } catch (err) {
    return handleError(err);
  }
}
