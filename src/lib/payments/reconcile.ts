import { notifyBeds24 } from './beds24';
import {
  getLastNotifyAttemptNumber,
  insertNotifyAttempt,
  markPaymentStatus,
} from './db';
import { sendOperatorAlert } from './resend';
import type { Env, PaymentRequestRecord } from './types';

const RETRY_DELAYS_SECONDS = [0, 60, 300, 900, 3600];

export async function reconcilePayment(env: Env, paymentRequest: PaymentRequestRecord): Promise<void> {
  const attemptNumber = (await getLastNotifyAttemptNumber(env, paymentRequest.id)) + 1;
  const result = await notifyBeds24(env, paymentRequest);

  if (result.ok) {
    await insertNotifyAttempt(env, paymentRequest.id, attemptNumber, 'success', result.requestPayload, result.status, result.body, null);
    await markPaymentStatus(env, paymentRequest.id, 'reconciled');
    if (attemptNumber > 1) {
      await sendOperatorAlert(env, { ...paymentRequest, status: 'reconciled' }, result.body, true);
    }
    return;
  }

  const nextRetryAt = getNextRetryAt(attemptNumber);
  await insertNotifyAttempt(
    env,
    paymentRequest.id,
    attemptNumber,
    'failed',
    result.requestPayload,
    result.status,
    result.body,
    nextRetryAt,
  );
  await markPaymentStatus(env, paymentRequest.id, 'unreconciled');

  if (attemptNumber >= 4) {
    await sendOperatorAlert(env, { ...paymentRequest, status: 'unreconciled' }, result.body, false);
  }
}

function getNextRetryAt(attemptNumber: number): string {
  const delay = RETRY_DELAYS_SECONDS[Math.min(attemptNumber, RETRY_DELAYS_SECONDS.length - 1)];
  return new Date(Date.now() + delay * 1000).toISOString();
}
