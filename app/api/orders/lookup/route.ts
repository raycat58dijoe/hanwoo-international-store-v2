import { NextRequest, NextResponse } from "next/server";
import { getOrdersByEmail, getUserBySessionToken } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

// Customer-facing order lookup.
// - Signed-in users are always resolved to their own account email (ignores
//   any submitted email, so you can't peek at someone else's orders).
// - Guests may look up by the email they used at checkout.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const signedInUser = sessionToken ? await getUserBySessionToken(sessionToken) : null;

  let email = "";
  if (signedInUser) {
    email = signedInUser.email;
  } else {
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
  }

  const orders = await getOrdersByEmail(email);
  return NextResponse.json({ orders });
}
