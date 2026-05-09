# Newlands Cottages Payments

This context covers the payment flow between Beds24, Newlands Cottages guests, and Yoco.

## Language

**Payment Request**:
A Beds24-originated request for a guest to pay a specific amount against a booking.
_Avoid_: Transaction, charge request, payment intent

**Payment Request Fingerprint**:
The stable identity of a Payment Request, derived from its Beds24 booking, invoice item, amount, and payment type.
_Avoid_: Idempotency key, checkout key

**Deposit Payment**:
The initial successful payment required to confirm a booking.
_Avoid_: Deposit, confirmation payment

**Balance Payment**:
A later successful payment against an already confirmed booking.
_Avoid_: Final payment, remaining payment

**Invoice Item**:
A Beds24 financial line item that can represent an unpaid amount requested from the guest.
_Avoid_: Line item, charge, balance

**Refund**:
A return of money to the guest against a previous Yoco payment.
_Avoid_: Reversal, cancellation

**Booking Status**:
The Beds24 lifecycle state of a booking.
_Avoid_: Payment status, checkout status

**Payment Reconciliation**:
The completed handoff where a successful Yoco payment has been notified to Beds24.
_Avoid_: Success redirect, checkout completion

**Unreconciled Payment**:
A successful Yoco payment that has not yet been successfully notified to Beds24.
_Avoid_: Failed payment, pending checkout

**Webhook Event**:
A verified Yoco event delivered to the middleware.
_Avoid_: Callback, notification

**Notify Attempt**:
An attempt by the middleware to tell Beds24 about a successful Yoco payment.
_Avoid_: Retry, callback attempt

**Operator**:
The person responsible for resolving payment reconciliation problems for Newlands Cottages.
_Avoid_: Admin, support user

## Relationships

- A **Payment Request** belongs to exactly one Beds24 booking.
- A **Payment Request Fingerprint** identifies one **Payment Request** across repeated guest clicks.
- Beds24 is the source of truth for a **Payment Request** amount.
- Beds24 is the source of truth for whether a **Payment Request** is for a **Deposit Payment** or **Balance Payment**.
- A valid **Payment Request** amount must exactly match a specific unpaid **Invoice Item** in Beds24.
- An unverified **Payment Request** must not create a Yoco checkout.
- Repeated guest clicks for the same pending **Payment Request** should reuse the existing Yoco checkout where possible.
- A successful **Deposit Payment** confirms the booking in Beds24.
- A successful **Balance Payment** records payment against an already confirmed booking without changing the booking lifecycle.
- A successful Beds24 notification records the payment and applies any allowed Booking Status change in one handoff.
- Current Beds24 **Booking Status** bounds lifecycle changes; stale payment links must not move a booking backward or otherwise change it unexpectedly.
- Cancelled or failed Yoco checkouts are recorded locally and are not reported to Beds24 as payments.
- A **Refund** belongs to exactly one previous Yoco payment.
- A **Webhook Event** may produce a **Notify Attempt**.
- A **Notify Attempt** belongs to exactly one **Payment Request**.
- V1 records enough payment identifiers to support manual **Refunds**, but does not initiate refunds.
- Guest return pages must not claim confirmation before **Payment Reconciliation** succeeds.
- A guest may be redirected to Beds24's booking confirmation page only after **Payment Reconciliation** succeeds.
- The guest success page polls briefly for **Payment Reconciliation** before showing a processing message.
- The Beds24 booking confirmation URL is deployment configuration because its session behavior must be tested.
- An **Unreconciled Payment** must be retried or surfaced to an operator until Beds24 records it.
- V1 alerts the **Operator** by email when an **Unreconciled Payment** cannot be reconciled automatically.
- V1 emails the **Operator** again if a previously alerted **Unreconciled Payment** later reconciles successfully.
- Operator emails identify the Beds24 booking, payment type, amount, Yoco checkout, Yoco payment when available, reconciliation status, and latest Beds24 error.
- V1 does not send guest emails; guest-facing email remains owned by Beds24 and Yoco.
- V1 sends Operator emails through Resend.
- Verified Yoco webhook events are processed idempotently; duplicate events must not duplicate Beds24 payments or Operator emails.
- V1 stores provider payloads needed for audit and debugging, excluding secrets, signatures, and card details.
- Payment records are retained indefinitely for reconciliation, while raw provider payload bodies are purged after 180 days.
- The Beds24 entry endpoint is public in v1; Beds24 API verification is the required gate before creating a Yoco checkout.
- Payment Requests are ZAR-only; omitted currency is treated as ZAR, and any explicit non-ZAR currency is rejected.
- Payment Request amount parsing follows the observed Beds24 Custom Gateway amount format and is normalized to cents before comparison or Yoco checkout creation.
- Beds24 Custom Gateway POST data must include booking id, payment amount, currency, payment type, description, and property id.
- The Beds24 notify key is a server-side credential used only when reporting successful payments back to Beds24.
- Yoco checkout metadata contains reconciliation identifiers only, not guest personal details.
- Beds24 owns the guest-facing Yoco checkout description, with middleware fallback wording for missing descriptions.
- Capture mode is controlled by deployment configuration on the normal Beds24 entry endpoint.

## Example dialogue

> **Dev:** "Should the middleware recalculate the amount before sending the guest to Yoco?"
> **Domain expert:** "No — Beds24 creates the **Payment Request**, and the middleware passes that amount through."
>
> **Dev:** "If Yoco confirms the required payment, should we leave the booking as new?"
> **Domain expert:** "No — successful payment means the **Booking Status** should become confirmed."
>
> **Dev:** "Should a later balance payment confirm the booking again?"
> **Domain expert:** "No — a **Balance Payment** only records payment because the booking is already confirmed."

## Flagged ambiguities

- "payment" can mean the request to pay, the Yoco checkout session, or the successful money movement; use **Payment Request** only for the Beds24-originated request.
- A Yoco success redirect is not **Payment Reconciliation**; only the verified Yoco webhook followed by successful Beds24 notification completes reconciliation.
- Automated **Refund** handling is deferred to v2; Beds24 refund support and the operator workflow are unresolved.
- A browser-visible gateway token was considered but rejected for v1 because it does not replace Beds24 server-side verification.
- An authenticated operator status page is deferred to v2.
