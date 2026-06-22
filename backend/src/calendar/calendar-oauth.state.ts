import * as crypto from 'crypto';

const STATE_TTL_MS = 15 * 60 * 1000;

export function createOAuthState(userId: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, ts: Date.now() }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyOAuthState(
  state: string,
  secret: string,
  userId: string,
): boolean {
  const dot = state.indexOf('.');
  if (dot <= 0) return false;

  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { userId?: string; ts?: number };

    if (data.userId !== userId) return false;
    if (typeof data.ts !== 'number') return false;
    if (Date.now() - data.ts > STATE_TTL_MS) return false;

    return true;
  } catch {
    return false;
  }
}
