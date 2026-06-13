import { Request, Response } from 'express';
import crypto from 'crypto';

const COOKIE_NAME = 'sid';

// 2-hour session window — long enough for a patient to browse and book,
// short enough that stale cookies don't accumulate indefinitely.
const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/**
 * Read the current session ID from the HttpOnly cookie.
 * Returns the sid string, or null if no cookie is present.
 */
export function getSessionId(req: Request): string | null {
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  if (!cookies) return null;
  return cookies[COOKIE_NAME] || null;
}

/**
 * Issue a new session cookie.
 * Call this when the patient first loads the booking page (GET /api/v1/public/session).
 * If a valid sid cookie already exists it is returned unchanged (idempotent).
 */
export function issueSessionCookie(req: Request, res: Response): string {
  const existing = getSessionId(req);
  if (existing) return existing;

  const sid = crypto.randomBytes(32).toString('hex');

  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true,                                           // Not accessible from JS — spoof-proof
    secure: process.env.NODE_ENV === 'production',           // HTTPS-only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_MAX_AGE_MS
  });

  return sid;
}
