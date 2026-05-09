import { formatZar } from './amount';
import { getRequiredEnv } from './config';
import type { Env, PaymentRequestRecord } from './types';

export async function sendOperatorAlert(
  env: Env,
  paymentRequest: PaymentRequestRecord,
  latestError: string,
  resolved: boolean,
): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.ALERT_FROM_EMAIL;
  const to = env.OPERATOR_EMAIL || 'info@clarkia.co.za';
  if (!apiKey || !from) {
    return;
  }

  const subject = resolved
    ? `Resolved payment reconciliation for booking ${paymentRequest.beds24_bookid}`
    : `Unreconciled payment for booking ${paymentRequest.beds24_bookid}`;
  const heading = resolved ? 'Payment reconciliation resolved' : 'Payment reconciliation needs attention';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${getRequiredEnv(env, 'RESEND_API_KEY')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `<h1>${heading}</h1>
<p>Check the booking invoice in Beds24 before manual action.</p>
<dl>
  <dt>Beds24 booking id</dt><dd>${paymentRequest.beds24_bookid}</dd>
  <dt>Payment type</dt><dd>${paymentRequest.payment_type}</dd>
  <dt>Amount</dt><dd>${formatZar(paymentRequest.amount_cents)}</dd>
  <dt>Yoco checkout id</dt><dd>${paymentRequest.yoco_checkout_id ?? ''}</dd>
  <dt>Yoco payment id</dt><dd>${paymentRequest.yoco_payment_id ?? ''}</dd>
  <dt>Reconciliation status</dt><dd>${paymentRequest.status}</dd>
  <dt>Latest Beds24 error</dt><dd>${latestError}</dd>
</dl>`,
    }),
  });
}
