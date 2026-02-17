import { NextRequest, NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { hash } from "bcryptjs";

// GET /api/profile?userId=X or own profile
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const userId = parseInt(url.searchParams.get("userId") || String(auth.userId));

    await initLocalDB();
    const db = await getDB();

    const user = await db.prepare(
      "SELECT id, username, profile_pic, bio, created_at FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get post count
    const postCount = await db.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE user_id = ?"
    ).bind(userId).first<{ count: number }>();

    // Get friend count
    const friendCount = await db.prepare(
      "SELECT COUNT(*) as count FROM friendships WHERE user1_id = ? OR user2_id = ?"
    ).bind(userId, userId).first<{ count: number }>();

    return NextResponse.json({
      profile: {
        ...user,
        postCount: postCount?.count || 0,
        friendCount: friendCount?.count || 0,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/profile — update own profile
export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bio, username, email, password, profile_pic } = await req.json();

    await initLocalDB();
    const db = await getDB();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio);
    }
    if (username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (password) {
      updates.push("password_hash = ?");
      values.push(await hash(password, 10));
    }
    if (profile_pic) {
      updates.push("profile_pic = ?");
      values.push(profile_pic);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    values.push(auth.userId);
    await db.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
