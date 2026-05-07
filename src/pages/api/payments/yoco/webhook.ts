import type { APIRoute } from 'astro';
import { getEnv } from '../../../../lib/payments/config';
import { getPaymentRequestByCheckoutId, insertWebhookEvent, markPaymentStatus } from '../../../../lib/payments/db';
import { json, methodNotAllowed } from '../../../../lib/payments/http';
import { reconcilePayment } from '../../../../lib/payments/reconcile';
import { extractYocoWebhook, verifyYocoWebhook } from '../../../../lib/payments/yoco';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const env = getEnv(context);
  const rawBody = await context.request.text();
  const verified = await verifyYocoWebhook(env, rawBody, context.request);
  if (!verified) {
    return json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const event = extractYocoWebhook(payload);
  const inserted = await insertWebhookEvent(
    env,
    event.eventId,
    event.eventType,
    event.checkoutId,
    event.paymentId,
    payload,
  );
  if (!inserted) {
    return json({ ok: true, duplicate: true });
  }

  if (!event.checkoutId) {
    return json({ ok: true, ignored: true });
  }

  const paymentRequest = await getPaymentRequestByCheckoutId(env, event.checkoutId);
  if (!paymentRequest) {
    return json({ ok: true, ignored: true });
  }

  if (event.outcome === 'paid') {
    await markPaymentStatus(env, paymentRequest.id, 'paid', event.paymentId ?? undefined, payload);
    await reconcilePayment(env, {
      ...paymentRequest,
      status: 'paid',
      yoco_payment_id: event.paymentId ?? paymentRequest.yoco_payment_id,
      raw_yoco_payload_json: JSON.stringify(payload),
    });
  } else if (event.outcome === 'failed' || event.outcome === 'cancelled') {
    await markPaymentStatus(env, paymentRequest.id, event.outcome, event.paymentId ?? undefined, payload);
  }

  return json({ ok: true });
};

export const ALL: APIRoute = async () => methodNotAllowed();
