CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  beds24_bookid TEXT NOT NULL,
  beds24_property_id TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'balance')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  description TEXT NOT NULL,
  beds24_invoice_item_reference TEXT,
  status TEXT NOT NULL CHECK (
    status IN (
      'capture_only',
      'verified',
      'checkout_created',
      'paid',
      'reconciled',
      'unreconciled',
      'failed',
      'cancelled'
    )
  ),
  yoco_checkout_id TEXT,
  yoco_checkout_redirect_url TEXT,
  yoco_payment_id TEXT,
  raw_beds24_payload_json TEXT,
  raw_yoco_payload_json TEXT,
  raw_payload_purge_after TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_checkout
  ON payment_requests (yoco_checkout_id);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status
  ON payment_requests (status, updated_at);

CREATE TABLE IF NOT EXISTS yoco_webhook_events (
  id TEXT PRIMARY KEY,
  yoco_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  yoco_checkout_id TEXT,
  yoco_payment_id TEXT,
  processed_at TEXT NOT NULL,
  raw_payload_json TEXT,
  raw_payload_purge_after TEXT
);

CREATE INDEX IF NOT EXISTS idx_yoco_webhook_events_checkout
  ON yoco_webhook_events (yoco_checkout_id);

CREATE TABLE IF NOT EXISTS beds24_notify_attempts (
  id TEXT PRIMARY KEY,
  payment_request_id TEXT NOT NULL REFERENCES payment_requests (id),
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  request_payload_json TEXT NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempted_at TEXT NOT NULL,
  next_retry_at TEXT,
  operator_alert_sent_at TEXT,
  operator_resolution_sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_beds24_notify_attempts_payment_request
  ON beds24_notify_attempts (payment_request_id, attempt_number);

CREATE INDEX IF NOT EXISTS idx_beds24_notify_attempts_next_retry
  ON beds24_notify_attempts (next_retry_at);
