import { getRequiredEnv } from './config';
import { base64ToBytes, hmacSha256Base64, timingSafeEqualString } from './crypto';
import type { Env, PaymentRequestRecord } from './types';

const YOCO_CHECKOUT_URL = 'https://payments.yoco.com/api/checkouts';

export async function createYocoCheckout(
  env: Env,
  paymentRequest: PaymentRequestRecord,
  origin: string,
): Promise<{ id: string; redirectUrl: string }> {
  const secretKey = getRequiredEnv(env, 'YOCO_SECRET_KEY');
  const response = await fetch(YOCO_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secretKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      amount: paymentRequest.amount_cents,
      currency: 'ZAR',
      successUrl: `${origin}/payments/success?id=${encodeURIComponent(paymentRequest.id)}`,
      cancelUrl: `${origin}/payments/cancelled?id=${encodeURIComponent(paymentRequest.id)}`,
      failureUrl: `${origin}/payments/failed?id=${encodeURIComponent(paymentRequest.id)}`,
      description: paymentRequest.description || `Payment for Newlands Cottages booking ${paymentRequest.beds24_bookid}`,
      metadata: {
        beds24_bookid: paymentRequest.beds24_bookid,
        beds24_property_id: paymentRequest.beds24_property_id,
        payment_type: paymentRequest.payment_type,
        payment_request_fingerprint: paymentRequest.fingerprint,
        site: 'newlands-cottages',
      },
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Yoco checkout creation failed with HTTP ${response.status}`);
  }

  const id = String(data.id ?? data.checkoutId ?? '');
  const redirectUrl = String(data.redirectUrl ?? data.redirect_url ?? data.url ?? '');
  if (!id || !redirectUrl) {
    throw new Error('Yoco checkout response did not include id and redirect URL');
  }

  return { id, redirectUrl };
}

export async function verifyYocoWebhook(env: Env, rawBody: string, request: Request): Promise<boolean> {
  const secret = getRequiredEnv(env, 'YOCO_WEBHOOK_SECRET');
  const webhookId = request.headers.get('webhook-id');
  const webhookTimestamp = request.headers.get('webhook-timestamp');
  const signatureHeader = request.headers.get('webhook-signature') || '';
  const provided = extractSignature(signatureHeader);
  if (!webhookId || !webhookTimestamp || !provided) {
    return false;
  }

  const timestampSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 180) {
    return false;
  }

  const secretValue = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = await hmacSha256Base64(base64ToBytes(secretValue), signedContent);
  return timingSafeEqualString(expected, provided);
}

export function extractYocoWebhook(payload: Record<string, unknown>): {
  eventId: string;
  eventType: string;
  checkoutId: string | null;
  paymentId: string | null;
  outcome: 'paid' | 'failed' | 'cancelled' | 'ignored';
} {
  const data = asRecord(payload.data) ?? asRecord(payload.payload) ?? payload;
  const checkout = asRecord(data.checkout) ?? data;
  const payment = asRecord(data.payment) ?? asRecord(data.charge) ?? data;
  const metadata = asRecord(data.metadata) ?? asRecord(payment.metadata) ?? asRecord(checkout.metadata);
  const eventType = String(payload.type ?? payload.event ?? payload.eventType ?? data.type ?? '');
  const status = String(data.status ?? checkout.status ?? payment.status ?? '').toLowerCase();
  const checkoutId = stringOrNull(
    data.checkoutId ?? data.checkout_id ?? metadata?.checkoutId ?? metadata?.checkout_id ?? payment.checkoutId,
  );
  const paymentId = stringOrNull(data.paymentId ?? data.payment_id ?? payment.id ?? payment.chargeId);
  const eventId = String(payload.id ?? payload.eventId ?? `${eventType}:${checkoutId ?? paymentId ?? crypto.randomUUID()}`);

  return {
    eventId,
    eventType: eventType || 'unknown',
    checkoutId,
    paymentId,
    outcome: classifyOutcome(eventType, status),
  };
}

function classifyOutcome(eventType: string, status: string): 'paid' | 'failed' | 'cancelled' | 'ignored' {
  const haystack = `${eventType} ${status}`.toLowerCase();
  if (haystack.includes('succeed') || haystack.includes('paid') || haystack.includes('complete')) {
    return 'paid';
  }
  if (haystack.includes('cancel')) {
    return 'cancelled';
  }
  if (haystack.includes('fail') || haystack.includes('decline') || haystack.includes('error')) {
    return 'failed';
  }
  return 'ignored';
}

function extractSignature(header: string): string | null {
  const parts = header.split(/\s+/).flatMap((part) => part.split(','));
  for (const part of parts) {
    const signature = part.trim();
    if (signature && signature !== 'v1') {
      return signature;
    }
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
}
