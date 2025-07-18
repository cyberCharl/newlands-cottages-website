export function joinWithBase(base: string, path: string): string {
  if (!base.endsWith('/')) base += '/';
  return base + path.replace(/^\/+/, '');
}
