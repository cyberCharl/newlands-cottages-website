import { normalizeAmountToCents } from './amount';
import { getOptionalEnv, getRequiredEnv } from './config';
import type { Beds24PaymentRequestInput, Env, InvoiceMatch, PaymentRequestRecord, VerificationResult } from './types';

export function parseBeds24PaymentRequest(formData: FormData): Beds24PaymentRequestInput {
  const rawFields = Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));
  const bookid = requireField(rawFields, 'bookid');
  const amount = requireField(rawFields, 'amount');
  const propertyId = requireField(rawFields, 'property_id');
  const paymentType = requireField(rawFields, 'payment_type');
  const description = rawFields.description || `Payment for Newlands Cottages booking ${bookid}`;
  const currency = rawFields.currency || 'ZAR';

  if (paymentType !== 'deposit' && paymentType !== 'balance') {
    throw new Error('Invalid payment_type');
  }

  if (currency && currency.toUpperCase() !== 'ZAR') {
    throw new Error('Only ZAR payments are supported');
  }

  return {
    bookid,
    amount,
    currency: currency.toUpperCase(),
    paymentType,
    description,
    propertyId,
    rawFields,
  };
}

export async function verifyBeds24PaymentRequest(
  env: Env,
  input: Beds24PaymentRequestInput,
  amountCents: number,
): Promise<VerificationResult> {
  const apiUrl = getRequiredEnv(env, 'BEDS24_API_URL');
  const apiToken = await getBeds24AccessToken(env);
  const url = new URL(apiUrl);
  url.searchParams.set('id', input.bookid);
  url.searchParams.set('includeInvoiceItems', 'true');

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      token: apiToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Beds24 verification failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  const invoiceItems = extractInvoiceItems(data);
  const depositItem = input.paymentType === 'deposit' ? extractDepositPaymentRequest(data, amountCents) : null;
  const balanceItem = input.paymentType === 'balance' ? extractBalancePaymentRequest(data, amountCents) : null;
  const invoiceItem = depositItem ?? balanceItem ?? invoiceItems.find((item) => item.amountCents === amountCents);

  if (!invoiceItem) {
    throw new Error('Payment amount does not match an unpaid Beds24 Invoice Item');
  }

  return {
    invoiceItem,
    bookingStatus: extractBookingStatus(data),
  };
}

async function getBeds24AccessToken(env: Env): Promise<string> {
  const refreshToken = getOptionalEnv(env, 'BEDS24_REFRESH_TOKEN');
  if (refreshToken) {
    const response = await fetch('https://api.beds24.com/v2/authentication/token', {
      headers: {
        accept: 'application/json',
        refreshToken,
      },
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok || typeof data.token !== 'string') {
      throw new Error(`Beds24 token refresh failed with HTTP ${response.status}`);
    }
    return data.token;
  }

  return getOptionalEnv(env, 'BEDS24_API_TOKEN') || getRequiredEnv(env, 'BEDS24_API_KEY');
}

export async function notifyBeds24(
  env: Env,
  paymentRequest: PaymentRequestRecord,
): Promise<{ ok: boolean; status: number | null; body: string; requestPayload: Record<string, string> }> {
  const notifyUrl = getRequiredEnv(env, 'BEDS24_NOTIFY_URL');
  const notifyKey = getRequiredEnv(env, 'BEDS24_NOTIFY_KEY');
  const paymentStatus = env.BEDS24_SUCCESS_PAYMENT_STATUS || 'paid';
  const payload: Record<string, string> = {
    key: notifyKey,
    bookid: paymentRequest.beds24_bookid,
    amount: (paymentRequest.amount_cents / 100).toFixed(2),
    currency: 'ZAR',
    payment_status: paymentStatus,
    txnid: paymentRequest.yoco_payment_id || paymentRequest.yoco_checkout_id || paymentRequest.id,
    description: paymentRequest.description,
  };

  if (paymentRequest.payment_type === 'deposit') {
    payload.status = '1';
  } else if (env.BEDS24_BALANCE_STATUS) {
    payload.status = env.BEDS24_BALANCE_STATUS;
  }

  try {
    const response = await fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload),
    });
    const body = await response.text();
    return {
      ok: response.ok && body.trim().length === 0,
      status: response.status,
      body,
      requestPayload: redactNotifyKey(payload),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: error instanceof Error ? error.message : 'Unknown Beds24 notify error',
      requestPayload: redactNotifyKey(payload),
    };
  }
}

function requireField(fields: Record<string, string>, key: string): string {
  const value = fields[key]?.trim();
  if (!value) {
    throw new Error(`Missing required field: ${key}`);
  }
  return value;
}

function extractInvoiceItems(data: unknown): InvoiceMatch[] {
  const items = findArrays(data)
    .flat()
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter(isPotentialUnpaidInvoiceItem);

  return items.flatMap((item) => {
    const amount = findAmountField(item);
    if (!amount) {
      return [];
    }

    try {
      return [
        {
          reference: String(item.id ?? item.invoice_item_id ?? item.reference ?? item.description ?? 'invoice-item'),
          amountCents: normalizeAmountToCents(amount),
          description: typeof item.description === 'string' ? item.description : undefined,
        },
      ];
    } catch {
      return [];
    }
  });
}

function extractDepositPaymentRequest(data: unknown, amountCents: number): InvoiceMatch | null {
  const booking = extractFirstBooking(data);
  if (!booking) {
    return null;
  }

  const deposit = booking.deposit;
  if (typeof deposit !== 'string' && typeof deposit !== 'number') {
    return null;
  }

  try {
    const depositCents = normalizeAmountToCents(String(deposit));
    if (depositCents !== amountCents) {
      return null;
    }
    return {
      reference: `booking-deposit:${String(booking.id ?? 'unknown')}`,
      amountCents: depositCents,
      description: 'Beds24 booking deposit',
    };
  } catch {
    return null;
  }
}

function extractBalancePaymentRequest(data: unknown, amountCents: number): InvoiceMatch | null {
  const booking = extractFirstBooking(data);
  if (!booking || !Array.isArray(booking.invoiceItems)) {
    return null;
  }

  const balanceCents = booking.invoiceItems.reduce((total, item) => {
    if (typeof item !== 'object' || item === null) {
      return total;
    }
    const record = item as Record<string, unknown>;
    const lineTotal = record.lineTotal ?? record.amount;
    if (typeof lineTotal !== 'string' && typeof lineTotal !== 'number') {
      return total;
    }

    try {
      return total + normalizeSignedAmountToCents(String(lineTotal));
    } catch {
      return total;
    }
  }, 0);

  if (balanceCents !== amountCents) {
    return null;
  }

  return {
    reference: `booking-balance:${String(booking.id ?? 'unknown')}`,
    amountCents: balanceCents,
    description: 'Beds24 booking balance',
  };
}

function normalizeSignedAmountToCents(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Missing amount');
  }

  const withoutCurrency = trimmed.replace(/[^\d.,-]/g, '');
  const normalized = normalizeSignedDecimalSeparator(withoutCurrency);
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error('Invalid amount');
  }

  return Math.round(parsed * 100);
}

function normalizeSignedDecimalSeparator(value: string): string {
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

function extractFirstBooking(data: unknown): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (Array.isArray(record.data) && typeof record.data[0] === 'object' && record.data[0] !== null) {
    return record.data[0] as Record<string, unknown>;
  }
  if (Array.isArray(data) && typeof data[0] === 'object' && data[0] !== null) {
    return data[0] as Record<string, unknown>;
  }
  return record;
}

function findArrays(value: unknown): unknown[][] {
  if (Array.isArray(value)) {
    return [value, ...value.flatMap(findArrays)];
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(findArrays);
  }
  return [];
}

function isPotentialUnpaidInvoiceItem(item: Record<string, unknown>): boolean {
  const status = String(item.status ?? item.payment_status ?? item.paid ?? item.is_paid ?? '').toLowerCase();
  if (status === 'paid' || status === 'true' || status === '1') {
    return false;
  }
  return Boolean(findAmountField(item));
}

function findAmountField(item: Record<string, unknown>): string | null {
  for (const key of ['amount', 'balance', 'due', 'unpaid', 'outstanding', 'price']) {
    const value = item[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
  }
  return null;
}

function extractBookingStatus(data: unknown): string | number | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }
  const record = data as Record<string, unknown>;
  const status = record.status ?? record.booking_status ?? record.bookingStatus;
  if (typeof status === 'string' || typeof status === 'number') {
    return status;
  }
  for (const value of Object.values(record)) {
    const nested = extractBookingStatus(value);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}

function redactNotifyKey(payload: Record<string, string>): Record<string, string> {
  return {
    ...payload,
    key: '[redacted]',
  };
}
