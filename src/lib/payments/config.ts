import type { Env } from './types';

export function getEnv(Astro: { locals?: { runtime?: { env?: Env } } }): Env {
  const env = Astro.locals?.runtime?.env;
  if (!env?.DB) {
    throw new Error('Missing Cloudflare D1 binding DB');
  }
  return env;
}

export function isCaptureMode(env: Env): boolean {
  return env.CAPTURE_MODE === 'true' || env.CAPTURE_MODE === '1';
}

export function getRequiredEnv(env: Env, key: keyof Env): string {
  const value = normalizeEnvValue(env[key]);
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required payment configuration: ${key}`);
  }
  return value;
}

export function getOptionalEnv(env: Env, key: keyof Env): string | undefined {
  const value = normalizeEnvValue(env[key]);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getOrigin(request: Request): string {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function normalizeEnvValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
