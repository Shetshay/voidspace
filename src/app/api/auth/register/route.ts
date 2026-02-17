import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getDB, initLocalDB } from "@/lib/db";
import { signToken, authCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await initLocalDB();
    const db = await getDB();

    // Check if email or username already exists
    const existing = await db.prepare(
      "SELECT id FROM users WHERE email = ? OR username = ?"
    ).bind(email, username).first();

    if (existing) {
      return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
    }

    const password_hash = await hash(password, 10);

    await db.prepare(
      "INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)"
    ).bind(email, username, password_hash).run();

    const user = await db.prepare(
      "SELECT id, email, username FROM users WHERE email = ?"
    ).bind(email).first<{ id: number; email: string; username: string }>();

    if (!user) {
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
    response.headers.set("Set-Cookie", authCookie(token));
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
