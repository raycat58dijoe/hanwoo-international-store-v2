import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "hw_session";
const SESSION_DAYS = 30;

/** scrypt password hashing — stored as "salt:hash". No external deps. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const test = scryptSync(password, salt, 64);
    const orig = Buffer.from(hash, "hex");
    return test.length === orig.length && timingSafeEqual(test, orig);
  } catch {
    return false;
  }
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
}

/** Set-Cookie header value (httpOnly, sameSite=lax; secure on https). */
export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
