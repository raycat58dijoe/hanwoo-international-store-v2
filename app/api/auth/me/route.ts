import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

// Returns the signed-in user (if any) based on the httpOnly session cookie.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });
  const user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
