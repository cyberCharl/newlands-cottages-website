import type { APIRoute } from 'astro';
import { normalizeAmountToCents } from '../../../../lib/payments/amount';
import { parseBeds24PaymentRequest, verifyBeds24PaymentRequest } from '../../../../lib/payments/beds24';
import { getEnv, getOrigin, isCaptureMode } from '../../../../lib/payments/config';
import { sha256Hex } from '../../../../lib/payments/crypto';
import {
  attachCheckout,
  getCompletedDepositPaymentRequest,
  getPaymentRequestByFingerprint,
  insertCaptureOnly,
  upsertVerifiedPaymentRequest,
} from '../../../../lib/payments/db';
import { badRequest, escapeHtml, html, methodNotAllowed } from '../../../../lib/payments/http';
import type { Beds24PaymentRequestInput, PaymentStatus } from '../../../../lib/payments/types';
import { createYocoCheckout } from '../../../../lib/payments/yoco';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const env = getEnv(context);
  const formData = await context.request.formData();

  try {
    let input = parseBeds24PaymentRequest(formData);
    const amountCents = normalizeAmountToCents(input.amount);
    input = await inferBalanceRequest(env, input, amountCents);

    const baseFingerprint = `${input.bookid}:${input.propertyId}:${input.paymentType}:${amountCents}`;
    const fingerprint = await sha256Hex(baseFingerprint);

    if (isCaptureMode(env)) {
      const record = await insertCaptureOnly(env, input, amountCents, fingerprint);
      return html(capturePage(record.id, input.rawFields));
    }

    const existing = await getPaymentRequestByFingerprint(env, fingerprint);
    if (existing && isCompletedStatus(existing.status)) {
      return Response.redirect(`/payments/success?id=${encodeURIComponent(existing.id)}`, 303);
    }

    const verification = await verifyBeds24PaymentRequest(env, input, amountCents);
    const verified = await upsertVerifiedPaymentRequest(
      env,
      input,
      amountCents,
      fingerprint,
      verification.invoiceItem.reference,
    );

    if (
      verified.yoco_checkout_id &&
      verified.yoco_checkout_redirect_url &&
      verified.status === 'checkout_created'
    ) {
      return Response.redirect(verified.yoco_checkout_redirect_url, 303);
    }

    const checkout = await createYocoCheckout(env, verified, getOrigin(context.request));
    await attachCheckout(env, verified.id, checkout.id, checkout.redirectUrl);
    return Response.redirect(checkout.redirectUrl, 303);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid payment request');
  }
};

export const ALL: APIRoute = async () => methodNotAllowed();

async function inferBalanceRequest(
  env: ReturnType<typeof getEnv>,
  input: Beds24PaymentRequestInput,
  amountCents: number,
): Promise<Beds24PaymentRequestInput> {
  if (input.paymentType !== 'deposit') {
    return input;
  }

  const completedDeposit = await getCompletedDepositPaymentRequest(env, input.bookid, input.propertyId, amountCents);
  if (!completedDeposit) {
    return input;
  }

  return {
    ...input,
    paymentType: 'balance',
    description: `Balance Payment for Newlands Cottages booking ${input.bookid}`,
    rawFields: {
      ...input.rawFields,
      inferred_payment_type: 'balance',
      original_payment_type: input.rawFields.payment_type,
      original_description: input.rawFields.description || '',
    },
  };
}

function isCompletedStatus(status: PaymentStatus): boolean {
  return status === 'paid' || status === 'reconciled' || status === 'unreconciled';
}

function capturePage(id: string, fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Payment capture mode</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f7f4ef; }
      main { max-width: 880px; margin: 0 auto; padding: 32px 20px; }
      h1 { margin: 0 0 12px; font-size: clamp(1.7rem, 5vw, 2.4rem); }
      p { color: #4a5568; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5ded2; border-radius: 8px; overflow: hidden; }
      th, td { padding: 12px 14px; border-bottom: 1px solid #eee7dc; text-align: left; vertical-align: top; }
      th { width: 220px; background: #fbfaf7; }
    </style>
  </head>
  <body>
    <main>
      <h1>Payment capture mode</h1>
      <p>Stored capture record ${escapeHtml(id)}. No Yoco checkout was created.</p>
      <table><tbody>${rows}</tbody></table>
    </main>
  </body>
</html>`;
}
