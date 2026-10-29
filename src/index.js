// Dependency-free helpers for Swedish rental and housing-cooperative arithmetic.
// Plain formulas over numbers you pass in. No network, no state, no private code.
// General information, not legal advice: the lease, the bylaws and the law decide.

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Index adjustment of a rent: rent x (1 + share x (newIndex / baseIndex - 1)).
 * `share` is a fraction (1 = the whole index change applies). `floor` keeps the rent from falling.
 */
export function adjustRentByIndex({ rent, baseIndex, newIndex, share = 1, floor = false }) {
  for (const [name, v] of Object.entries({ rent, baseIndex, newIndex, share })) {
    if (!Number.isFinite(v)) throw new RangeError(`${name} must be a finite number`);
  }
  if (rent <= 0 || baseIndex <= 0 || newIndex <= 0) throw new RangeError("rent and both index values must be above zero");
  if (share < 0 || share > 1) throw new RangeError("share is a fraction between 0 and 1");
  const indexChange = newIndex / baseIndex - 1;
  let applied = indexChange * share;
  if (floor && applied < 0) applied = 0;
  return { indexChangePercent: indexChange * 100, appliedChangePercent: applied * 100, newRent: round2(rent * (1 + applied)) };
}

/** Splits an amount into net, VAT and gross. `rate` is a fraction (0.25). */
export function splitVat(amount, { includesVat = false, rate = 0.25 } = {}) {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("amount must be a number from zero up");
  const net = includesVat ? round2(amount / (1 + rate)) : round2(amount);
  const vat = round2(net * rate);
  return { net, vat, gross: round2(net + vat) };
}

/**
 * Fee increase (in percent of today's fees) that covers a rate change on refinanced loans plus other cost changes.
 * loans: [{ amount, ratePercent, refinance }]. A rate cut cannot push a loan's interest below zero.
 */
export function brfFeeIncrease({ annualFees, loans, rateChangePoints, otherCostChange = 0 }) {
  if (!Number.isFinite(annualFees) || annualFees <= 0) throw new RangeError("annualFees must be above zero");
  const interestChange = loans
    .filter((l) => l.refinance)
    .reduce((sum, l) => sum + ((Math.max(0, l.ratePercent + rateChangePoints) - l.ratePercent) * l.amount) / 100, 0);
  const totalCostChange = round2(interestChange + otherCostChange);
  return { interestChange: round2(interestChange), totalCostChange, requiredIncreasePercent: (totalCostChange / annualFees) * 100 };
}

/** Luhn (modulus 10) check digit for a string of digits, the check used by Swedish OCR payment references. */
export function luhnCheckDigit(digits) {
  if (!/^\d+$/.test(digits)) throw new RangeError("digits only");
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** True when the last digit of `value` is the Luhn check digit of the digits before it. */
export function isValidLuhn(value) {
  return /^\d{2,}$/.test(value) && luhnCheckDigit(value.slice(0, -1)) === Number(value.slice(-1));
}

/** Riksbank reference rate (percent) in force on an ISO date, from rows like data/referensranta.json. Null before the first row. */
export function referenceRateOn(isoDate, rows) {
  let found = null;
  for (const row of rows) if (row.from <= isoDate) found = row;
  return found ? found.ratePercent : null;
}

/** Statutory late-payment interest rate (percent per year): reference rate + 8 percentage points (3 and 6 §§ räntelagen). */
export function lateInterestRateOn(isoDate, rows) {
  const ref = referenceRateOn(isoDate, rows);
  return ref === null ? null : ref + 8;
}
