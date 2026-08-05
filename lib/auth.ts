import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "hw_session";
const SESSION_DAYS = 30;

// Stateless session secret — must be stable across deployments. Injected by
// deploy.mjs from .authsecret. Falls back to a dev-only value locally.
const AUTH_SECRET = process.env.AUTH_SECRET || "local-dev-secret-change-me";

/* ---------- password hashing (scrypt, stored "salt:hash") ---------- */
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

/* ---------- stateless JWT-style session (HMAC-SHA256, no DB writes) ---------- */
const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
}

export function signToken(payload: SessionUser): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({ ...payload, exp: Date.now() + SESSION_DAYS * 86400_000 })
  );
  const sig = createHmac("sha256", AUTH_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  try {
    const expected = createHmac("sha256", AUTH_SECRET).update(`${header}.${body}`).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { uid: payload.uid, email: payload.email, name: payload.name ?? "" };
  } catch {
    return null;
  }
}

/* ---------- cookies ---------- */
export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
