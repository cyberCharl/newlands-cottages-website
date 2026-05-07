import { randomId } from './crypto';
import type { Beds24PaymentRequestInput, Env, PaymentRequestRecord, PaymentStatus } from './types';

const RAW_PAYLOAD_RETENTION_DAYS = 180;

export async function insertCaptureOnly(
  env: Env,
  input: Beds24PaymentRequestInput,
  amountCents: number | null,
  fingerprint: string,
): Promise<PaymentRequestRecord> {
  const now = new Date().toISOString();
  const id = randomId('pr');
  const purgeAfter = addDays(now, RAW_PAYLOAD_RETENTION_DAYS);

  await env.DB.prepare(
    `INSERT INTO payment_requests (
      id, fingerprint, beds24_bookid, beds24_property_id, payment_type, amount_cents,
      currency, description, status, raw_beds24_payload_json, raw_payload_purge_after,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'capture_only', ?, ?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET
      raw_beds24_payload_json = excluded.raw_beds24_payload_json,
      raw_payload_purge_after = excluded.raw_payload_purge_after,
      updated_at = excluded.updated_at`,
  )
    .bind(
      id,
      fingerprint,
      input.bookid,
      input.propertyId,
      input.paymentType,
      amountCents ?? 0,
      input.currency || 'ZAR',
      input.description,
      JSON.stringify(input.rawFields),
      purgeAfter,
      now,
      now,
    )
    .run();

  return getPaymentRequestByFingerprint(env, fingerprint) as Promise<PaymentRequestRecord>;
}

export async function upsertVerifiedPaymentRequest(
  env: Env,
  input: Beds24PaymentRequestInput,
  amountCents: number,
  fingerprint: string,
  invoiceReference: string,
): Promise<PaymentRequestRecord> {
  const now = new Date().toISOString();
  const id = randomId('pr');
  const purgeAfter = addDays(now, RAW_PAYLOAD_RETENTION_DAYS);

  await env.DB.prepare(
    `INSERT INTO payment_requests (
      id, fingerprint, beds24_bookid, beds24_property_id, payment_type, amount_cents,
      currency, description, beds24_invoice_item_reference, status, raw_beds24_payload_json,
      raw_payload_purge_after, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'ZAR', ?, ?, 'verified', ?, ?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET
      beds24_bookid = excluded.beds24_bookid,
      beds24_property_id = excluded.beds24_property_id,
      payment_type = excluded.payment_type,
      amount_cents = excluded.amount_cents,
      description = excluded.description,
      beds24_invoice_item_reference = excluded.beds24_invoice_item_reference,
      raw_beds24_payload_json = excluded.raw_beds24_payload_json,
      raw_payload_purge_after = excluded.raw_payload_purge_after,
      updated_at = excluded.updated_at`,
  )
    .bind(
      id,
      fingerprint,
      input.bookid,
      input.propertyId,
      input.paymentType,
      amountCents,
      input.description,
      invoiceReference,
      JSON.stringify(input.rawFields),
      purgeAfter,
      now,
      now,
    )
    .run();

  return getPaymentRequestByFingerprint(env, fingerprint) as Promise<PaymentRequestRecord>;
}

export async function getPaymentRequestById(env: Env, id: string): Promise<PaymentRequestRecord | null> {
  return env.DB.prepare('SELECT * FROM payment_requests WHERE id = ?').bind(id).first<PaymentRequestRecord>();
}

export async function getPaymentRequestByFingerprint(
  env: Env,
  fingerprint: string,
): Promise<PaymentRequestRecord | null> {
  return env.DB.prepare('SELECT * FROM payment_requests WHERE fingerprint = ?')
    .bind(fingerprint)
    .first<PaymentRequestRecord>();
}

export async function getPaymentRequestByCheckoutId(
  env: Env,
  checkoutId: string,
): Promise<PaymentRequestRecord | null> {
  return env.DB.prepare('SELECT * FROM payment_requests WHERE yoco_checkout_id = ?')
    .bind(checkoutId)
    .first<PaymentRequestRecord>();
}

export async function attachCheckout(
  env: Env,
  id: string,
  checkoutId: string,
  redirectUrl: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE payment_requests
    SET status = 'checkout_created', yoco_checkout_id = ?, yoco_checkout_redirect_url = ?, updated_at = ?
    WHERE id = ?`,
  )
    .bind(checkoutId, redirectUrl, new Date().toISOString(), id)
    .run();
}

export async function markPaymentStatus(
  env: Env,
  id: string,
  status: PaymentStatus,
  yocoPaymentId?: string,
  rawYocoPayload?: unknown,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE payment_requests
    SET status = ?, yoco_payment_id = COALESCE(?, yoco_payment_id),
      raw_yoco_payload_json = COALESCE(?, raw_yoco_payload_json), updated_at = ?
    WHERE id = ?`,
  )
    .bind(
      status,
      yocoPaymentId ?? null,
      rawYocoPayload ? JSON.stringify(rawYocoPayload) : null,
      new Date().toISOString(),
      id,
    )
    .run();
}

export async function insertWebhookEvent(
  env: Env,
  eventId: string,
  eventType: string,
  checkoutId: string | null,
  paymentId: string | null,
  rawPayload: unknown,
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO yoco_webhook_events (
      id, yoco_event_id, event_type, yoco_checkout_id, yoco_payment_id,
      processed_at, raw_payload_json, raw_payload_purge_after
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      randomId('we'),
      eventId,
      eventType,
      checkoutId,
      paymentId,
      now,
      JSON.stringify(rawPayload),
      addDays(now, RAW_PAYLOAD_RETENTION_DAYS),
    )
    .run();

  return result.meta.changes > 0;
}

export async function insertNotifyAttempt(
  env: Env,
  paymentRequestId: string,
  attemptNumber: number,
  status: 'success' | 'failed',
  requestPayload: unknown,
  responseStatus: number | null,
  responseBody: string,
  nextRetryAt: string | null,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO beds24_notify_attempts (
      id, payment_request_id, attempt_number, status, request_payload_json,
      response_status, response_body, attempted_at, next_retry_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      randomId('na'),
      paymentRequestId,
      attemptNumber,
      status,
      JSON.stringify(requestPayload),
      responseStatus,
      responseBody,
      new Date().toISOString(),
      nextRetryAt,
    )
    .run();
}

export async function getLastNotifyAttemptNumber(env: Env, paymentRequestId: string): Promise<number> {
  const row = await env.DB.prepare(
    'SELECT MAX(attempt_number) AS attempt_number FROM beds24_notify_attempts WHERE payment_request_id = ?',
  )
    .bind(paymentRequestId)
    .first<{ attempt_number: number | null }>();
  return row?.attempt_number ?? 0;
}

export async function getDueUnreconciledPaymentRequests(env: Env, limit = 25): Promise<PaymentRequestRecord[]> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `SELECT pr.*
    FROM payment_requests pr
    WHERE pr.status = 'unreconciled'
      AND EXISTS (
        SELECT 1 FROM beds24_notify_attempts na
        WHERE na.payment_request_id = pr.id
          AND na.next_retry_at IS NOT NULL
          AND na.next_retry_at <= ?
      )
    ORDER BY pr.updated_at ASC
    LIMIT ?`,
  )
    .bind(now, limit)
    .all<PaymentRequestRecord>();
  return result.results ?? [];
}

export async function purgeExpiredRawPayloads(env: Env): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE payment_requests
      SET raw_beds24_payload_json = NULL, raw_yoco_payload_json = NULL
      WHERE raw_payload_purge_after IS NOT NULL AND raw_payload_purge_after <= ?`,
    ).bind(now),
    env.DB.prepare(
      `UPDATE yoco_webhook_events
      SET raw_payload_json = NULL
      WHERE raw_payload_purge_after IS NOT NULL AND raw_payload_purge_after <= ?`,
    ).bind(now),
  ]);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
