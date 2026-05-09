import { readFileSync, existsSync } from 'node:fs';

const envFile = '.dev.vars';
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    process.env[key] ??= valueParts.join('=');
  }
}

const secretKey = process.env.YOCO_SECRET_KEY;
const webhookUrl =
  process.argv[2] ?? process.env.YOCO_WEBHOOK_URL ?? 'https://attitude-judiciary-designing.ngrok-free.dev/api/payments/yoco/webhook';

if (!secretKey) {
  console.error('Missing YOCO_SECRET_KEY. Add it to .dev.vars or export it before running this script.');
  process.exit(1);
}

const response = await fetch('https://payments.yoco.com/api/webhooks', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${secretKey}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    name: 'newlands-cottages-local-ngrok',
    url: webhookUrl,
  }),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Yoco webhook registration failed with HTTP ${response.status}`);
  console.error(body);
  process.exit(1);
}

console.log(body);
console.error('\nSave the returned "secret" value as YOCO_WEBHOOK_SECRET in .dev.vars. Yoco only shows it once.');
