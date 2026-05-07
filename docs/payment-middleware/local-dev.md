# Payment Middleware Local Development

Create the D1 database and update `wrangler.jsonc` with the returned production database id:

```sh
npx wrangler d1 create newlands-cottages-payments
npx wrangler d1 migrations apply newlands-cottages-payments --local
```

Required secrets:

```sh
npx wrangler secret put YOCO_SECRET_KEY
npx wrangler secret put YOCO_WEBHOOK_SECRET
npx wrangler secret put BEDS24_API_KEY
npx wrangler secret put BEDS24_NOTIFY_KEY
npx wrangler secret put RESEND_API_KEY
```

Non-secret variables are configured in `wrangler.jsonc`. Keep `CAPTURE_MODE=true` for the initial Beds24 Custom Gateway rollout so raw POST fields can be confirmed before live Yoco checkouts are created.

Useful local commands:

```sh
npm run build
npm run preview
```

For ngrok webhook testing, set:

```sh
YOCO_WEBHOOK_URL=https://attitude-judiciary-designing.ngrok-free.dev/api/payments/yoco/webhook
```

Register a Yoco test webhook after adding `YOCO_SECRET_KEY` to `.dev.vars`:

```sh
node scripts/register-yoco-webhook.mjs "$YOCO_WEBHOOK_URL"
```

Copy the returned `secret` into `.dev.vars` as `YOCO_WEBHOOK_SECRET`. Yoco only shows that value once.

For Beds24 API V2, prefer storing the durable refresh token:

```text
BEDS24_REFRESH_TOKEN=...
```

If you only have an invite code, exchange it once:

```sh
curl -sS https://api.beds24.com/v2/authentication/setup \
  -H "accept: application/json" \
  -H "code: YOUR_INVITE_CODE"
```

Save the returned `refreshToken` as `BEDS24_REFRESH_TOKEN`. The short-lived returned `token` can be used as `BEDS24_API_TOKEN` for a quick test, but it expires.

For a local Beds24 round trip, set the confirmation URL to the Beds24 confirmation page:

```text
BEDS24_CONFIRMATION_URL=https://beds24.com/booking.php?page=bookconfirmed
```

Testing on 2026-05-07 confirmed the Beds24 session can survive the Yoco round trip in the local ngrok flow.
