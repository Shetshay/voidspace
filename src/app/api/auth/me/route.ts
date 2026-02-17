import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDB, initLocalDB } from "@/lib/db";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await initLocalDB();
    const db = await getDB();

    const user = await db.prepare(
      "SELECT id, email, username, profile_pic, bio, created_at FROM users WHERE id = ?"
    ).bind(auth.userId).first();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
