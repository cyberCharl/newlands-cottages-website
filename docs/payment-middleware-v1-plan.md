# Payment Middleware V1 Plan

This plan covers the Cloudflare Workers + D1 middleware between Beds24 Custom Gateway and Yoco Checkout for Newlands Cottages. It follows the domain language in `CONTEXT.md` and the platform decision in `docs/adr/0001-host-payment-middleware-on-cloudflare.md`.

## Goals

- Accept Beds24-originated Payment Requests for deposit and balance payments.
- Verify each Payment Request against Beds24 before creating a Yoco checkout.
- Treat Yoco webhooks, not browser redirects, as payment truth.
- Notify Beds24 after successful Yoco payment so Beds24 records the payment and applies the allowed Booking Status change.
- Retry and alert the Operator when a successful Yoco payment cannot be reconciled to Beds24.
- Record enough identifiers to support manual Yoco refunds later, without implementing refunds in v1.

## Non-Goals

- No guest emails from the middleware.
- No refund initiation or refund automation.
- No authenticated operator/admin status page.
- No middleware-owned booking lifecycle beyond the status sent in the Beds24 notify handoff.
- No local rate, deposit, balance, discount, or cancellation-policy calculations.

## External Systems

- Beds24 Custom Gateway posts browser-visible Payment Request fields to the Worker entry endpoint.
- Beds24 API verifies booking status and unpaid Invoice Items server-side.
- Beds24 Custom Gateway notify endpoint records successful payments back to Beds24.
- Yoco Checkout collects the guest payment.
- Yoco webhooks confirm payment success/failure server-side.
- Resend sends Operator exception and resolution emails.
- Cloudflare D1 stores Payment Requests, Webhook Events, Notify Attempts, and retry state.

## Beds24 POST Contract

Configure Beds24 Custom Gateway POST data to include:

```text
bookid=[BOOKID]&amount=[PAYMENTAMOUNT]&currency=[PROPERTYCURRENCY]&payment_type=deposit_or_balance&description=Deposit Payment for Newlands Cottages booking [BOOKID]&property_id=[PROPERTYID]
```

Use separate Beds24 configuration/templates if needed so deposit requests send `payment_type=deposit` and balance requests send `payment_type=balance`.

The initial rollout should enable capture mode on the normal payment entry endpoint. Capture mode stores raw Beds24 payloads and shows a diagnostic page without creating Yoco checkouts. Use it to confirm:

- the exact `[PAYMENTAMOUNT]` format
- the exact currency value or omission behavior
- whether useful invoice/payment-request references can be added to the POST data
- the deposit and balance flows post distinct `payment_type` values

## Endpoints

- `POST /api/payments/beds24/start`
  - Receives Beds24 Custom Gateway POST data.
  - In capture mode, stores the payload and returns a diagnostic page.
  - Outside capture mode, validates required fields, verifies against Beds24, creates or reuses a pending Yoco checkout, and redirects the guest to Yoco.

- `POST /api/payments/yoco/webhook`
  - Verifies the Yoco webhook signature using the raw request body.
  - Stores verified events idempotently.
  - On successful payment, records the Yoco payment id and starts Beds24 notification.
  - On cancelled/failed checkout, records local state only.

- `GET /payments/success`
  - Polls reconciliation status for up to 20 seconds.
  - Redirects to `BEDS24_CONFIRMATION_URL` only after Payment Reconciliation succeeds.
  - Shows a processing page if reconciliation is not complete.

- `GET /payments/cancelled`
  - Shows a retry-friendly cancellation page.

- `GET /payments/failed`
  - Shows a retry-friendly failure page.

- `GET /api/payments/status/:id`
  - Returns minimal status for the success page polling flow.
  - Does not expose raw payloads, errors, or guest data.

## Verification Rules

- Beds24 is the source of truth for Payment Request amount and payment type.
- A valid Payment Request must match one specific unpaid Invoice Item in Beds24.
- Do not create a Yoco checkout for an unverified Payment Request.
- Treat omitted currency as ZAR; reject any explicit non-ZAR currency.
- Normalize the observed Beds24 amount format to integer cents before comparing with Beds24 API data or creating a Yoco checkout.
- Reuse an existing pending Yoco checkout for the same Payment Request Fingerprint where possible.
- If a checkout is terminally failed, cancelled, or expired, create a new attempt linked to the same Payment Request.

## Yoco Checkout

Create Yoco Checkout server-side with:

- amount in cents
- currency `ZAR`
- success, cancel, and failure URLs on the current Cloudflare deployment domain
- guest-facing description from Beds24, with middleware fallback wording
- metadata containing only reconciliation identifiers:

```json
{
  "beds24_bookid": "...",
  "beds24_property_id": "...",
  "payment_type": "deposit|balance",
  "payment_request_fingerprint": "...",
  "site": "newlands-cottages"
}
```

Do not include guest names, email addresses, phone numbers, card details, or internal notes in Yoco metadata.

## Beds24 Notification

After a verified Yoco payment succeeds, notify Beds24 with the server-side `BEDS24_NOTIFY_KEY`.

Include at least:

- Beds24 booking id
- paid amount
- successful payment status value confirmed during integration testing
- Yoco payment id as transaction id
- description
- Booking Status change:
  - Deposit Payment: confirm booking with `status=1`, bounded by current Beds24 Booking Status.
  - Balance Payment: record payment without changing lifecycle, using `status=-2` or omitting status after testing confirms the safest behavior.

If notification fails, mark the payment as Unreconciled and retry.

## Retry And Alerts

Retry failed Beds24 notification:

- immediately
- after 1 minute
- after 5 minutes
- after 15 minutes

If the 15-minute attempt fails, email the Operator at `info@clarkia.co.za`.

Continue slower retries afterward, for example hourly for 24 hours. If a previously alerted Unreconciled Payment later reconciles successfully, send a resolution email to the Operator.

Operator emails should include:

- Beds24 booking id
- payment type
- amount
- Yoco checkout id
- Yoco payment id when available
- reconciliation status
- latest Beds24 error
- instruction to check the booking invoice in Beds24 before manual action

## D1 Schema

Minimum tables:

```text
payment_requests
- id
- fingerprint unique
- beds24_bookid
- beds24_property_id
- payment_type deposit|balance
- amount_cents
- currency
- description
- beds24_invoice_item_id/reference
- status: capture_only|verified|checkout_created|paid|reconciled|unreconciled|failed|cancelled
- yoco_checkout_id
- yoco_checkout_redirect_url
- yoco_payment_id
- raw_beds24_payload_json
- raw_yoco_payload_json
- raw_payload_purge_after
- created_at
- updated_at

yoco_webhook_events
- id
- yoco_event_id unique
- event_type
- yoco_checkout_id
- yoco_payment_id
- processed_at
- raw_payload_json
- raw_payload_purge_after

beds24_notify_attempts
- id
- payment_request_id
- attempt_number
- status success|failed
- request_payload_json
- response_status
- response_body
- attempted_at
- next_retry_at
- operator_alert_sent_at
- operator_resolution_sent_at
```

Payment records are retained indefinitely for reconciliation. Raw provider payload bodies are purged after 180 days.

## Configuration And Secrets

- `YOCO_SECRET_KEY`
- `YOCO_WEBHOOK_SECRET`
- Beds24 API credentials with booking and financial read access
- `BEDS24_NOTIFY_KEY`
- `RESEND_API_KEY`
- `OPERATOR_EMAIL=info@clarkia.co.za`
- `ALERT_FROM_EMAIL`
- `BEDS24_CONFIRMATION_URL`
- `CAPTURE_MODE`

Use Cloudflare secrets for credentials and environment variables for non-secret configuration.

## Implementation Slices

1. Cloudflare Worker and D1 foundation
   - Add Worker routing/configuration.
   - Add D1 migrations.
   - Add local/dev environment documentation.

2. Capture mode
   - Implement `POST /api/payments/beds24/start`.
   - Store raw Beds24 payloads.
   - Return a diagnostic page while `CAPTURE_MODE=true`.

3. Beds24 verification
   - Add Beds24 API client.
   - Verify booking status and exact unpaid Invoice Item amount.
   - Normalize amount to cents.
   - Reject unverified Payment Requests before checkout creation.

4. Yoco checkout creation
   - Add Yoco client.
   - Create/reuse pending checkouts per Payment Request Fingerprint.
   - Redirect guests to Yoco.

5. Guest return pages
   - Add success, cancelled, and failed pages.
   - Add minimal status polling endpoint.
   - Redirect to Beds24 confirmation URL only after reconciliation succeeds.

6. Yoco webhook reconciliation
   - Verify raw-body webhook signature.
   - Store events idempotently.
   - Handle successful, failed, and cancelled payment states.

7. Beds24 notify and retry worker
   - Post successful payments to Beds24 with `BEDS24_NOTIFY_KEY`.
   - Record Notify Attempts.
   - Retry on schedule.

8. Resend operator alerts
   - Send failure alert after the 15-minute retry fails.
   - Send resolution email if later reconciliation succeeds.

9. Retention cleanup
   - Purge raw provider payload bodies after 180 days.
   - Keep normalized payment records.

10. Production readiness test
   - Run Beds24 capture mode for deposit and balance flows.
   - Confirm Yoco test checkout and webhook payloads.
   - Confirm Beds24 notify field values, especially successful `payment_status` and status behavior.
   - Confirm Beds24 confirmation URL behavior after the Yoco redirect round trip.
   - Disable capture mode only after all checks pass.

## Open Test Gates

- Exact Beds24 API response shape for booking invoice items.
- Exact Beds24 `[PAYMENTAMOUNT]` posted format.
- Exact Beds24 successful `payment_status` notify value.
- Whether Balance Payment should send `status=-2` or omit status.
- Whether Beds24 confirmation URL works reliably after the Yoco detour.
- Exact Yoco test-mode webhook payload shape and event ids.
