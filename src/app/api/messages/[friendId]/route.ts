import { NextRequest, NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/messages/[friendId] — get message history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { friendId } = await params;
    const fId = parseInt(friendId);

    await initLocalDB();
    const db = await getDB();

    const result = await db.prepare(`
      SELECT m.*, u.username as sender_username
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.recipient_id = ?)
         OR (m.sender_id = ? AND m.recipient_id = ?)
      ORDER BY m.created_at ASC
    `).bind(auth.userId, fId, fId, auth.userId).all();

    // Get friend info
    const friend = await db.prepare(
      "SELECT id, username, profile_pic FROM users WHERE id = ?"
    ).bind(fId).first();

    return NextResponse.json({ messages: result.results, friend });
  } catch (error) {
    console.error("Messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages/[friendId] — send message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { friendId } = await params;
    const fId = parseInt(friendId);
    const { text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Message text required" }, { status: 400 });
    }

    await initLocalDB();
    const db = await getDB();

    await db.prepare(
      "INSERT INTO messages (sender_id, recipient_id, text) VALUES (?, ?, ?)"
    ).bind(auth.userId, fId, text.trim()).run();

    // Return the new message
    const message = await db.prepare(`
      SELECT m.*, u.username as sender_username
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.sender_id = ? AND m.recipient_id = ?
      ORDER BY m.id DESC LIMIT 1
    `).bind(auth.userId, fId).first();

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
