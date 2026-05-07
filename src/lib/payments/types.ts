export type PaymentType = 'deposit' | 'balance';

export type PaymentStatus =
  | 'capture_only'
  | 'verified'
  | 'checkout_created'
  | 'paid'
  | 'reconciled'
  | 'unreconciled'
  | 'failed'
  | 'cancelled';

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface Env {
  DB: D1Database;
  YOCO_SECRET_KEY?: string;
  YOCO_WEBHOOK_SECRET?: string;
  BEDS24_API_URL?: string;
  BEDS24_API_KEY?: string;
  BEDS24_API_TOKEN?: string;
  BEDS24_REFRESH_TOKEN?: string;
  BEDS24_NOTIFY_URL?: string;
  BEDS24_NOTIFY_KEY?: string;
  BEDS24_SUCCESS_PAYMENT_STATUS?: string;
  BEDS24_BALANCE_STATUS?: string;
  RESEND_API_KEY?: string;
  OPERATOR_EMAIL?: string;
  ALERT_FROM_EMAIL?: string;
  BEDS24_CONFIRMATION_URL?: string;
  CAPTURE_MODE?: string;
}

export interface Beds24PaymentRequestInput {
  bookid: string;
  amount: string;
  currency: string;
  paymentType: PaymentType;
  description: string;
  propertyId: string;
  rawFields: Record<string, string>;
}

export interface PaymentRequestRecord {
  id: string;
  fingerprint: string;
  beds24_bookid: string;
  beds24_property_id: string;
  payment_type: PaymentType;
  amount_cents: number;
  currency: string;
  description: string;
  beds24_invoice_item_reference: string | null;
  status: PaymentStatus;
  yoco_checkout_id: string | null;
  yoco_checkout_redirect_url: string | null;
  yoco_payment_id: string | null;
  raw_beds24_payload_json: string | null;
  raw_yoco_payload_json: string | null;
  raw_payload_purge_after: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceMatch {
  reference: string;
  amountCents: number;
  description?: string;
}

export interface VerificationResult {
  invoiceItem: InvoiceMatch;
  bookingStatus?: string | number;
}
