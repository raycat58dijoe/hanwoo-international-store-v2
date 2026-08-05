import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, genId } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }

  const user: User = {
    id: genId("usr"),
    email,
    passwordHash: hashPassword(password),
    name: name || email.split("@")[0],
    createdAt: new Date().toISOString(),
  };

  try {
    await createUser(user);
  } catch (e: any) {
    if (e?.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
