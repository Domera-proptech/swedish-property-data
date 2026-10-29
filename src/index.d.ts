export type RateRow = { from: string; ratePercent: number };
export type Loan = { amount: number; ratePercent: number; refinance: boolean };

export function adjustRentByIndex(input: { rent: number; baseIndex: number; newIndex: number; share?: number; floor?: boolean }): {
  indexChangePercent: number;
  appliedChangePercent: number;
  newRent: number;
};
export function splitVat(amount: number, options?: { includesVat?: boolean; rate?: number }): { net: number; vat: number; gross: number };
export function brfFeeIncrease(input: { annualFees: number; loans: Loan[]; rateChangePoints: number; otherCostChange?: number }): {
  interestChange: number;
  totalCostChange: number;
  requiredIncreasePercent: number;
};
export function luhnCheckDigit(digits: string): number;
export function isValidLuhn(value: string): boolean;
export function referenceRateOn(isoDate: string, rows: readonly RateRow[]): number | null;
export function lateInterestRateOn(isoDate: string, rows: readonly RateRow[]): number | null;
