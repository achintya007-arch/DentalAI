import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// ----------------------------------------------------------------------------
// Lightweight session auth: a signed JWT stored in an httpOnly cookie.
// Chosen over a heavier library to keep the MVP simple and dependency-light.
// ----------------------------------------------------------------------------

const COOKIE_NAME = "dfa_session";
const SESSION_DAYS = 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  if (s.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  userId: string;
  clinicId: string;
  role: "OWNER" | "RECEPTIONIST";
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  cookies().delete(COOKIE_NAME);
}

/** Throws if there is no valid session. Use inside API routes / server actions. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
