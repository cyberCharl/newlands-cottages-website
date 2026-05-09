export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  });
}

export function html(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...init.headers,
    },
  });
}

export function methodNotAllowed(): Response {
  return json({ error: 'Method not allowed' }, { status: 405 });
}

export function badRequest(message: string): Response {
  return html(
    paymentMessagePage('Payment request problem', message, 'Please contact Newlands Cottages if this keeps happening.'),
    { status: 400 },
  );
}

export function paymentMessagePage(title: string, heading: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f7f4ef; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { width: min(640px, 100%); background: white; border: 1px solid #e5ded2; border-radius: 8px; padding: 28px; box-shadow: 0 18px 60px rgb(23 32 51 / 0.08); }
      h1 { margin: 0 0 12px; font-size: clamp(1.6rem, 5vw, 2.2rem); line-height: 1.1; }
      p { margin: 0; font-size: 1rem; line-height: 1.6; color: #4a5568; }
      a { color: #0f766e; }
    </style>
  </head>
  <body>
    <main><section><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(body)}</p></section></main>
  </body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
