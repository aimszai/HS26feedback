import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set to at least 32 characters');
  }
  return secret;
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function readCookie(req) {
  const cookies = req.headers.cookie || '';
  const cookie = cookies.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : '';
}

export function credentialsConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD) && process.env.ADMIN_SESSION_SECRET?.length >= 32;
}

export function credentialsMatch(username, password) {
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

export function createSessionCookie() {
  const payload = Buffer.from(JSON.stringify({
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  const secure = (process.env.VERCEL || process.env.VERCEL_ENV === 'production') ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = (process.env.VERCEL || process.env.VERCEL_ENV === 'production') ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${secure}`;
}

export function isAdminAuthenticated(req) {
  try {
    const token = readCookie(req);
    const separator = token.indexOf('.');
    if (separator <= 0) return false;

    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, sign(payload))) return false;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(session.expiresAt) && session.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
