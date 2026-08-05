import { NextRequest, NextResponse } from "next/server";
import { signToken, sessionCookieHeader } from "@/lib/auth";

// Admin login: verify the secret key and return a short-lived JWT so the
// admin dashboard knows it's genuinely authenticated (not just localStorage).
const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "Incorrect key." }, { status: 401 });
  }
  const token = signToken({ uid: "admin", email: "admin@local", name: "Admin" });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionCookieHeader(token));
  return res;
}
