import type { APIRoute } from 'astro';
import { getEnv } from '../../../lib/payments/config';
import { getDueUnreconciledPaymentRequests, purgeExpiredRawPayloads } from '../../../lib/payments/db';
import { json, methodNotAllowed } from '../../../lib/payments/http';
import { reconcilePayment } from '../../../lib/payments/reconcile';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const env = getEnv(context);
  const authHeader = context.request.headers.get('authorization') ?? '';
  const expected = env.BEDS24_NOTIFY_KEY ? `Bearer ${env.BEDS24_NOTIFY_KEY}` : '';
  if (!expected || authHeader !== expected) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const due = await getDueUnreconciledPaymentRequests(env);
  for (const paymentRequest of due) {
    await reconcilePayment(env, paymentRequest);
  }
  await purgeExpiredRawPayloads(env);

  return json({ ok: true, retried: due.length });
};

export const ALL: APIRoute = async () => methodNotAllowed();
