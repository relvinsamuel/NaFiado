export const DEFAULT_BCV_RATE = 36;

export function normalizeRate(rate?: number | null) {
  if (!rate || Number.isNaN(rate) || rate <= 0) return DEFAULT_BCV_RATE;
  return rate;
}

export function usdToBs(amountUsd: number, rate: number) {
  return Number(amountUsd || 0) * normalizeRate(rate);
}

export function bsToUsd(amountBs: number, rate: number) {
  return Number(amountBs || 0) / normalizeRate(rate);
}

export function formatUsd(amount: number) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function formatBs(amount: number) {
  return `Bs ${Number(amount || 0).toFixed(2)}`;
}
