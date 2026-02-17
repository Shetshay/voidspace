import { NextRequest, NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    const { text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    await initLocalDB();
    const db = await getDB();

    await db.prepare(
      "INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)"
    ).bind(postId, auth.userId, text.trim()).run();

    // Return the new comment with user info
    const comment = await db.prepare(`
      SELECT c.*, u.username, u.profile_pic
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.user_id = ?
      ORDER BY c.id DESC LIMIT 1
    `).bind(postId, auth.userId).first();

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
