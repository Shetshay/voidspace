import { NextRequest, NextResponse } from "next/server";
import { getDB, initLocalDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/posts?level=10&page=1
export async function GET(req: NextRequest) {
  try {
    await initLocalDB();
    const db = await getDB();
    const auth = await getAuthUser();

    const url = new URL(req.url);
    const level = parseInt(url.searchParams.get("level") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let posts;

    if (level === 10) {
      // Public feed — anyone can see
      const result = await db.prepare(`
        SELECT p.*, u.username, u.profile_pic
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.level = 10
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();
      posts = result.results;
    } else if (level === 20 && auth) {
      // Friends feed
      const result = await db.prepare(`
        SELECT p.*, u.username, u.profile_pic
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.level <= 20
          AND (p.user_id = ? OR p.user_id IN (
            SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END
            FROM friendships
            WHERE user1_id = ? OR user2_id = ?
          ))
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(auth.userId, auth.userId, auth.userId, auth.userId, limit, offset).all();
      posts = result.results;
    } else if (level === 30 && auth) {
      // Close friends feed
      const result = await db.prepare(`
        SELECT p.*, u.username, u.profile_pic
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.level <= 30
          AND (p.user_id = ? OR p.user_id IN (
            SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END
            FROM friendships
            WHERE (user1_id = ? OR user2_id = ?) AND is_close = 1
          ))
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(auth.userId, auth.userId, auth.userId, auth.userId, limit, offset).all();
      posts = result.results;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch comments for each post
    const postsWithComments = await Promise.all(
      (posts as Record<string, unknown>[]).map(async (post) => {
        const commentsResult = await db.prepare(`
          SELECT c.*, u.username, u.profile_pic
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ?
          ORDER BY c.created_at ASC
        `).bind(post.id).all();
        return { ...post, comments: commentsResult.results };
      })
    );

    return NextResponse.json({ posts: postsWithComments });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts — create a post
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, media_url, level } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Post text is required" }, { status: 400 });
    }

    const postLevel = [10, 20, 30].includes(level) ? level : 10;

    await initLocalDB();
    const db = await getDB();

    await db.prepare(
      "INSERT INTO posts (user_id, text, media_url, level) VALUES (?, ?, ?, ?)"
    ).bind(auth.userId, text.trim(), media_url || null, postLevel).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create post error:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
