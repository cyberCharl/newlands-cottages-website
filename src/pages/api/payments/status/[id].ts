import type { APIRoute } from 'astro';
import { getEnv } from '../../../../lib/payments/config';
import { getPaymentRequestById } from '../../../../lib/payments/db';
import { json } from '../../../../lib/payments/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getEnv(context);
  const id = context.params.id;
  if (!id) {
    return json({ error: 'Missing payment request id' }, { status: 400 });
  }

  const paymentRequest = await getPaymentRequestById(env, id);
  if (!paymentRequest) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  return json({
    id: paymentRequest.id,
    status: paymentRequest.status,
    reconciled: paymentRequest.status === 'reconciled',
  });
};
