import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/auth";

// Small helpers to keep API route handlers consistent and terse.

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a handler so Zod / auth errors become clean JSON responses. */
export function handleError(err: unknown) {
  if (err instanceof UnauthorizedError) return fail("Unauthorized", 401);
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 422 });
  }
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error", err);
  return fail("Something went wrong", 500);
}
