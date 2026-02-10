/** Validate an external URL: must parse and use https: protocol */
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try { return new URL(raw).protocol === 'https:' ? raw : null; }
  catch { return null; }
}
