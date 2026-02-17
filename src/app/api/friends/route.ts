import { NextRequest, NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/friends — list friends
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await initLocalDB();
    const db = await getDB();

    const result = await db.prepare(`
      SELECT u.id, u.username, u.profile_pic, u.bio, f.is_close
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.user1_id = ? THEN f.user2_id ELSE f.user1_id END
      WHERE f.user1_id = ? OR f.user2_id = ?
    `).bind(auth.userId, auth.userId, auth.userId).all();

    return NextResponse.json({ friends: result.results });
  } catch (error) {
    console.error("Friends list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/friends — send friend request
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, type } = await req.json();
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    await initLocalDB();
    const db = await getDB();

    const target = await db.prepare(
      "SELECT id FROM users WHERE username = ?"
    ).bind(username).first<{ id: number }>();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.id === auth.userId) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

    // Check if already friends
    const existing = await db.prepare(`
      SELECT id FROM friendships
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).bind(auth.userId, target.id, target.id, auth.userId).first();

    if (existing && type !== "close") {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    // Check for existing request
    const existingReq = await db.prepare(
      "SELECT id FROM friend_requests WHERE from_id = ? AND to_id = ? AND type = ?"
    ).bind(auth.userId, target.id, type || "friend").first();

    if (existingReq) {
      return NextResponse.json({ error: "Request already sent" }, { status: 409 });
    }

    await db.prepare(
      "INSERT INTO friend_requests (from_id, to_id, type) VALUES (?, ?, ?)"
    ).bind(auth.userId, target.id, type || "friend").run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
