import { test } from "node:test";
import assert from "node:assert/strict";
import { isWithinWindow, isStopMessage, isStartMessage } from "../src/lib/whatsapp/window";
import { render } from "../src/lib/whatsapp/templates";
import { bucketDecision } from "../src/lib/ratelimit";
import { conflictRange } from "../src/lib/booking";

// ---------------------------------------------------------------------------
// 24-hour customer-service window
// ---------------------------------------------------------------------------

test("window: inbound 23h ago allows free-form; 25h ago does not", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  assert.equal(isWithinWindow(new Date("2026-06-14T13:00:00Z"), now), true); // 23h
  assert.equal(isWithinWindow(new Date("2026-06-14T11:00:00Z"), now), false); // 25h
  assert.equal(isWithinWindow(null, now), false);
});

test("STOP/START detection is case- and whitespace-insensitive", () => {
  assert.equal(isStopMessage(" STOP "), true);
  assert.equal(isStopMessage("unsubscribe"), true);
  assert.equal(isStopMessage("please stop calling"), false); // not a bare keyword
  assert.equal(isStartMessage("Start"), true);
});

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

test("templates render params into {{n}} placeholders in order", () => {
  const out = render("reminder_24h", ["Ravi", "Smile Dental", "15 Jun, 6:00 pm"]);
  assert.match(out, /Ravi/);
  assert.match(out, /Smile Dental/);
  assert.match(out, /15 Jun, 6:00 pm/);
  assert.doesNotMatch(out, /\{\{\d+\}\}/); // no unfilled placeholders
});

// ---------------------------------------------------------------------------
// Rate limiter decision logic
// ---------------------------------------------------------------------------

test("rate limit: fresh key allowed, exhausted bucket blocked, expired window resets", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const win = 15 * 60 * 1000;

  assert.equal(bucketDecision(null, now, 5, win).allowed, true);
  assert.equal(
    bucketDecision({ windowStart: new Date(now.getTime() - 60_000), count: 5 }, now, 5, win).allowed,
    false
  );
  const expired = bucketDecision({ windowStart: new Date(now.getTime() - win - 1), count: 5 }, now, 5, win);
  assert.equal(expired.allowed, true);
  assert.equal(expired.reset, true);
});

// ---------------------------------------------------------------------------
// Double-booking window math
// ---------------------------------------------------------------------------

test("conflictRange spans ±30 minutes around the slot", () => {
  const slot = new Date("2026-06-16T10:00:00Z");
  const { from, to } = conflictRange(slot);
  assert.equal(from.toISOString(), "2026-06-16T09:30:00.000Z");
  assert.equal(to.toISOString(), "2026-06-16T10:30:00.000Z");
});
