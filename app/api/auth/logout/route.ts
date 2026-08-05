import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookieHeader } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookieHeader());
  return res;
}
