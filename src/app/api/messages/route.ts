import { NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/messages — list conversations (friends with latest message)
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await initLocalDB();
    const db = await getDB();

    // Get all friends with the latest message
    const result = await db.prepare(`
      SELECT
        u.id,
        u.username,
        u.profile_pic,
        (
          SELECT m.text FROM messages m
          WHERE (m.sender_id = u.id AND m.recipient_id = ?)
             OR (m.sender_id = ? AND m.recipient_id = u.id)
          ORDER BY m.created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at FROM messages m
          WHERE (m.sender_id = u.id AND m.recipient_id = ?)
             OR (m.sender_id = ? AND m.recipient_id = u.id)
          ORDER BY m.created_at DESC LIMIT 1
        ) as last_message_at
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.user1_id = ? THEN f.user2_id ELSE f.user1_id END
      WHERE f.user1_id = ? OR f.user2_id = ?
      ORDER BY last_message_at DESC NULLS LAST
    `).bind(
      auth.userId, auth.userId,
      auth.userId, auth.userId,
      auth.userId, auth.userId, auth.userId
    ).all();

    return NextResponse.json({ conversations: result.results });
  } catch (error) {
    console.error("Conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
