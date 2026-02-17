import { NextRequest, NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/friends/requests — get incoming requests
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await initLocalDB();
    const db = await getDB();

    const result = await db.prepare(`
      SELECT fr.*, u.username as from_username, u.profile_pic as from_profile_pic
      FROM friend_requests fr
      JOIN users u ON u.id = fr.from_id
      WHERE fr.to_id = ?
      ORDER BY fr.created_at DESC
    `).bind(auth.userId).all();

    return NextResponse.json({ requests: result.results });
  } catch (error) {
    console.error("Requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/friends/requests — accept or decline
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, action } = await req.json();
    if (!requestId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await initLocalDB();
    const db = await getDB();

    const request = await db.prepare(
      "SELECT * FROM friend_requests WHERE id = ? AND to_id = ?"
    ).bind(requestId, auth.userId).first<{
      id: number; from_id: number; to_id: number; type: string;
    }>();

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "accept") {
      if (request.type === "close") {
        // Upgrade existing friendship to close
        await db.prepare(`
          UPDATE friendships SET is_close = 1
          WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
        `).bind(request.from_id, request.to_id, request.to_id, request.from_id).run();
      } else {
        // Create friendship (use smaller id as user1)
        const [u1, u2] = request.from_id < request.to_id
          ? [request.from_id, request.to_id]
          : [request.to_id, request.from_id];

        try {
          await db.prepare(
            "INSERT INTO friendships (user1_id, user2_id) VALUES (?, ?)"
          ).bind(u1, u2).run();
        } catch {
          // Already friends
        }
      }
    }

    // Delete the request
    await db.prepare("DELETE FROM friend_requests WHERE id = ?").bind(requestId).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept/decline error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
