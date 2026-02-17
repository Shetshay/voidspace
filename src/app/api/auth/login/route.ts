import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { getDB, initLocalDB } from "@/lib/db";
import { signToken, authCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await initLocalDB();
    const db = await getDB();

    const user = await db.prepare(
      "SELECT id, email, username, password_hash FROM users WHERE email = ?"
    ).bind(email).first<{ id: number; email: string; username: string; password_hash: string }>();

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
    response.headers.set("Set-Cookie", authCookie(token));
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
