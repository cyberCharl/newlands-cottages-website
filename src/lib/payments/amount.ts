export function normalizeAmountToCents(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Missing amount');
  }

  const withoutCurrency = trimmed.replace(/[^\d.,-]/g, '');
  const normalized = normalizeDecimalSeparator(withoutCurrency);
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Invalid amount');
  }

  return Math.round(parsed * 100);
}

function normalizeDecimalSeparator(value: string): string {
  const lastDot = value.lastIndexOf('.');
  const lastComma = value.lastIndexOf(',');

  if (lastDot === -1 && lastComma === -1) {
    return value;
  }

  const decimalIndex = Math.max(lastDot, lastComma);
  const integerPart = value.slice(0, decimalIndex).replace(/[.,]/g, '');
  const decimalPart = value.slice(decimalIndex + 1).replace(/[.,]/g, '');
  return `${integerPart}.${decimalPart}`;
}

export function formatZar(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}
