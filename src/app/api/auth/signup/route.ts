import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";

const TRIAL_DAYS = 14;

export async function POST(req: Request) {
  try {
    const body = signupSchema.parse(await req.json());

    // Trial-farming protection: max 5 signups per IP per hour.
    const limit = await checkRateLimit(`signup:ip:${clientIp(req)}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return fail("Too many signups from this network. Try again later.", 429);
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return fail("An account with this email already exists", 409);

    const passwordHash = await hashPassword(body.password);
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Create clinic + owner + default settings in one transaction.
    const clinic = await prisma.clinic.create({
      data: {
        name: body.clinicName,
        city: body.city,
        trialEndsAt,
        settings: { create: {} },
        users: {
          create: {
            email: body.email,
            name: body.name,
            passwordHash,
            role: "OWNER",
          },
        },
      },
      include: { users: true },
    });

    const user = clinic.users[0];
    await createSession({ userId: user.id, clinicId: clinic.id, role: "OWNER", email: user.email });

    return ok({ clinicId: clinic.id, userId: user.id }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
