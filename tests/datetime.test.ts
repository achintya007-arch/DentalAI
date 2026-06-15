import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSlot, zonedWallTimeToUtc, isValidFutureSlot } from "../src/lib/datetime";

// ---------------------------------------------------------------------------
// Fix #1 — AI appointment timezone handling.
// A naive wall-clock time from the AI must be interpreted in the CLINIC's
// timezone, not the server's. These tests prove 16:00 in Asia/Kolkata maps to
// 10:30 UTC (offset +05:30), which the old `new Date(...)` got wrong on a UTC
// server (it produced 16:00 UTC = 21:30 IST).
// ---------------------------------------------------------------------------

test("Asia/Kolkata wall time converts to correct UTC (offset +5:30)", () => {
  const utc = zonedWallTimeToUtc("2026-06-15T16:00:00", "Asia/Kolkata");
  assert.equal(utc.toISOString(), "2026-06-15T10:30:00.000Z");
});

test("parseSlot interprets naive time in the clinic timezone", () => {
  const slot = parseSlot("2026-06-15T09:00:00", "Asia/Kolkata");
  // 09:00 IST == 03:30 UTC
  assert.equal(slot?.toISOString(), "2026-06-15T03:30:00.000Z");
});

test("parseSlot respects an explicit offset and does NOT re-zone it", () => {
  const slot = parseSlot("2026-06-15T16:00:00+05:30", "Asia/Kolkata");
  assert.equal(slot?.toISOString(), "2026-06-15T10:30:00.000Z");
});

test("parseSlot trusts a Z (UTC) timestamp as-is", () => {
  const slot = parseSlot("2026-06-15T10:30:00Z", "Asia/Kolkata");
  assert.equal(slot?.toISOString(), "2026-06-15T10:30:00.000Z");
});

test("a New York wall time converts with its own offset, not the server's", () => {
  // 09:00 in America/New_York on this date is EDT (-04:00) => 13:00 UTC
  const utc = zonedWallTimeToUtc("2026-06-15T09:00:00", "America/New_York");
  assert.equal(utc.toISOString(), "2026-06-15T13:00:00.000Z");
});

test("parseSlot returns null for empty / invalid input", () => {
  assert.equal(parseSlot(null, "Asia/Kolkata"), null);
  assert.equal(parseSlot("", "Asia/Kolkata"), null);
  assert.equal(parseSlot("not-a-date", "Asia/Kolkata"), null);
});

test("isValidFutureSlot rejects past and far-future, accepts near-future", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  assert.equal(isValidFutureSlot(new Date("2026-06-14T00:00:00Z"), now), false); // past
  assert.equal(isValidFutureSlot(new Date("2026-06-15T00:05:00Z"), now), false); // <15 min
  assert.equal(isValidFutureSlot(new Date("2026-06-16T10:00:00Z"), now), true); // ok
  assert.equal(isValidFutureSlot(new Date("2028-06-15T00:00:00Z"), now), false); // >1y
});
