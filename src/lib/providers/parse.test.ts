import assert from "node:assert/strict";
import test from "node:test";
import { isLikelyEtf, looksLikeEquitySymbol, parseCountWithLimit, parseTwNumber } from "./parse.ts";

test("parseTwNumber keeps first token so 762(15) is not 76215", () => {
  assert.equal(parseTwNumber("762(15)"), 762);
  assert.equal(parseTwNumber("1,234.50"), 1234.5);
  assert.equal(parseTwNumber("--"), null);
  assert.equal(parseTwNumber("▼1.20"), -1.2);
});

test("parseCountWithLimit splits 漲停 parentheses", () => {
  assert.deepEqual(parseCountWithLimit("762(15)"), { count: 762, limit: 15 });
  assert.deepEqual(parseCountWithLimit("210(1)"), { count: 210, limit: 1 });
  assert.deepEqual(parseCountWithLimit("88"), { count: 88, limit: null });
});

test("looksLikeEquitySymbol accepts 4-6 digit TW tickers including ETFs", () => {
  assert.equal(looksLikeEquitySymbol("2330"), true);
  assert.equal(looksLikeEquitySymbol("00878"), true);
  assert.equal(looksLikeEquitySymbol("006208"), true);
  assert.equal(looksLikeEquitySymbol("6488A"), true);
  assert.equal(looksLikeEquitySymbol("TSMC"), false);
});

test("isLikelyEtf flags 00-prefix codes", () => {
  assert.equal(isLikelyEtf("00878", "國泰永續高股息"), true);
  assert.equal(isLikelyEtf("2330", "台積電"), false);
});
