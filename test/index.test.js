import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { adjustRentByIndex, brfFeeIncrease, isValidLuhn, lateInterestRateOn, luhnCheckDigit, referenceRateOn, splitVat } from "../src/index.js";

const rates = JSON.parse(readFileSync(new URL("../data/referensranta.json", import.meta.url), "utf8"));

test("index adjustment: 600 000 x 420 / 410", () => {
  assert.equal(adjustRentByIndex({ rent: 600000, baseIndex: 410, newIndex: 420 }).newRent, 614634.15);
  assert.equal(adjustRentByIndex({ rent: 600000, baseIndex: 410, newIndex: 420, share: 0.8 }).newRent, 611707.32);
});

test("index adjustment: a falling index is held by a floor and passes through without one", () => {
  assert.equal(adjustRentByIndex({ rent: 600000, baseIndex: 410, newIndex: 400, floor: true }).newRent, 600000);
  assert.equal(adjustRentByIndex({ rent: 600000, baseIndex: 410, newIndex: 400 }).newRent, 585365.85);
});

test("index adjustment refuses nonsense", () => {
  assert.throws(() => adjustRentByIndex({ rent: 0, baseIndex: 1, newIndex: 1 }), RangeError);
  assert.throws(() => adjustRentByIndex({ rent: 1, baseIndex: 1, newIndex: 1, share: 2 }), RangeError);
});

test("VAT: 25 % on net, and backwards from gross", () => {
  assert.deepEqual(splitVat(45000), { net: 45000, vat: 11250, gross: 56250 });
  assert.deepEqual(splitVat(125, { includesVat: true }), { net: 100, vat: 25, gross: 125 });
});

test("BRF fee: 40 000 000 refinanced at +1,5 points on 4 800 000 of fees is 12,5 %", () => {
  const r = brfFeeIncrease({
    annualFees: 4800000,
    rateChangePoints: 1.5,
    loans: [
      { amount: 40000000, ratePercent: 3.2, refinance: true },
      { amount: 20000000, ratePercent: 4.1, refinance: false },
    ],
  });
  assert.equal(r.interestChange, 600000);
  assert.equal(Math.round(r.requiredIncreasePercent * 1e6) / 1e6, 12.5);
});

test("BRF fee: a rate cut larger than the rate cannot make interest negative", () => {
  const r = brfFeeIncrease({ annualFees: 1000000, rateChangePoints: -10, loans: [{ amount: 10000000, ratePercent: 3, refinance: true }] });
  assert.equal(r.interestChange, -300000);
});

test("Luhn: known OCR-style numbers", () => {
  assert.equal(luhnCheckDigit("7992739871"), 3); // the standard Luhn example 79927398713
  assert.equal(isValidLuhn("79927398713"), true);
  assert.equal(isValidLuhn("79927398714"), false);
});

test("reference rate and late interest from the shipped table", () => {
  assert.equal(referenceRateOn("2024-03-01", rates.rows), 4);
  assert.equal(referenceRateOn("2021-12-31", rates.rows), null);
  assert.equal(lateInterestRateOn("2026-10-18", rates.rows), 10);
});

test("the shipped table agrees with itself: sorted, half-year starts, half-point steps", () => {
  for (const [i, row] of rates.rows.entries()) {
    assert.match(row.from, /^\d{4}-(01|07)-01$/);
    assert.equal((row.ratePercent * 2) % 1, 0);
    if (i > 0) assert.ok(rates.rows[i - 1].from < row.from);
  }
});

test("the KPI file is monthly, gap-free and the two SCB tables meet at 2025-12 / 2026-01", () => {
  const lines = readFileSync(new URL("../data/kpi-monthly.csv", import.meta.url), "utf8").trim().split("\n").slice(1);
  const rows = lines.map((l) => l.split(","));
  let [y, m] = rows[0][0].split("-").map(Number);
  for (const [month, value] of rows) {
    assert.equal(month, `${y}-${String(m).padStart(2, "0")}`);
    assert.ok(Number(value) > 90 && Number(value) < 1000, month);
    m++;
    if (m === 13) { m = 1; y++; }
  }
  const at = (k) => Number(rows.find((r) => r[0] === k)[1]);
  assert.ok(Math.abs(at("2026-01") / at("2025-12") - 1) < 0.01);
});

test("the statutory figures all carry a source and a legal basis", () => {
  const data = JSON.parse(readFileSync(new URL("../data/statutory-figures.json", import.meta.url), "utf8"));
  for (const f of data.figures) {
    assert.ok(f.sourceUrl.startsWith("https://"), f.id);
    assert.ok(f.legalBasis.length > 5, f.id);
  }
});
