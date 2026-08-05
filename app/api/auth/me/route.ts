import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

// Returns the signed-in user from the stateless session token (no DB hit).
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.uid, email: user.email, name: user.name } });
}
