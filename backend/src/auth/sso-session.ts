/**
 * Central SSO session cookie.
 *
 * After Core Hub redirects an authenticated user to `/auth/callback`, the
 * subsystem stores the *Core Hub* access token in an HttpOnly cookie so the
 * browser can keep calling the subsystem's own APIs without a second login.
 *
 * The cookie only carries a Core Hub token that is verified on every request
 * exactly like a Bearer token - the subsystem still creates no session, no
 * password and no identity of its own.
 */
import { timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';

export const SSO_COOKIE_NAME = 'core_hub_access_token';

/** Reads one cookie out of a raw `Cookie:` header without extra dependencies. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    if (part.slice(0, separator).trim() !== name) {
      continue;
    }

    const value = part.slice(separator + 1).trim();

    return value.length > 0 ? decodeURIComponent(value) : null;
  }

  return null;
}

/** Serialises the SSO cookie. `maxAgeSec` follows the Core Hub token lifetime. */
export function buildSsoCookie(
  token: string,
  maxAgeSec: number,
  secure: boolean,
): string {
  const attributes = [
    `${SSO_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`,
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export const SSO_STATE_COOKIE_NAME = 'csmju_software_license_manager_sso_state';

export function buildSsoStateCookie(
  state: string,
  next: string,
  secure: boolean,
): string {
  const payload = `${state}.${Buffer.from(next, 'utf8').toString('base64url')}`;

  const attributes = [
    `${SSO_STATE_COOKIE_NAME}=${payload}`,
    'Path=/auth/callback',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600',
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function deleteSsoStateCookie(secure: boolean): string {
  const attributes = [
    `${SSO_STATE_COOKIE_NAME}=`,
    'Path=/auth/callback',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function parseSsoStateCookie(value: string | null) {
  if (!value) {
    return null;
  }

  const separatorIndex = value.indexOf('.');

  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null;
  }

  const state = value.slice(0, separatorIndex);
  const nextPayload = value.slice(separatorIndex + 1);

  try {
    const next = Buffer.from(nextPayload, 'base64url').toString('utf8');
    return { state, next };
  } catch {
    return null;
  }
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  return cryptoTimingSafeEqual(aBuffer, bBuffer);
}
