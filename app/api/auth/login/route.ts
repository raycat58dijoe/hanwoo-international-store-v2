import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createSession, getUserBySessionToken } from "@/lib/db";
import { verifyPassword, newSessionToken, sessionExpiry, sessionCookieHeader, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Reuse an existing valid session cookie if present (refresh expiry).
  const cookieToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookieToken && (await getUserBySessionToken(cookieToken))) {
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  }

  const token = newSessionToken();
  await createSession(token, user.id, sessionExpiry());

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    debug: { tokenLen: token.length, sessionFound: !!(await getUserBySessionToken(token)) },
  });
  res.headers.set("Set-Cookie", sessionCookieHeader(token));
  return res;
}
