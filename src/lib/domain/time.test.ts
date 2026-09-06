import assert from "node:assert/strict";
import test from "node:test";
import { classifySession, parseMarketDate, recentWeekdaysIso, rocToIso } from "./time.ts";

test("parseMarketDate accepts Gregorian yyyymmdd and ROC", () => {
  assert.equal(parseMarketDate("20260904"), "2026-09-04");
  assert.equal(parseMarketDate("2026-09-04"), "2026-09-04");
  assert.equal(parseMarketDate("1150904"), "2026-09-04");
  assert.equal(parseMarketDate("115/09/04"), "2026-09-04");
});

test("rocToIso does not treat 20xxxxxx as ROC", () => {
  assert.equal(rocToIso("1150904"), "2026-09-04");
  assert.equal(parseMarketDate("20260904"), "2026-09-04");
});

test("recentWeekdaysIso skips Saturday and Sunday", () => {
  const days = recentWeekdaysIso("2026-09-06", 3);
  assert.deepEqual(days, ["2026-09-04", "2026-09-03", "2026-09-02"]);
});

test("Sunday in Taipei is holiday session", () => {
  const sunday = new Date("2026-09-06T02:00:00Z");
  assert.equal(classifySession(sunday), "holiday");
});
