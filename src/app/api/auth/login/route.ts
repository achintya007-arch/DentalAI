import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return fail("Invalid email or password", 401);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return fail("Invalid email or password", 401);

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
