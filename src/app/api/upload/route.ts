import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDB, initLocalDB } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const GLOBAL_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB in bytes

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initLocalDB();
    const db = await getDB();

    // Check global storage usage
    const usage = await db.prepare(
      "SELECT COALESCE(SUM(file_size), 0) as total FROM uploads"
    ).first<{ total: number }>();

    const totalUsed = usage?.total || 0;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB per file max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Check global limit
    if (totalUsed + file.size > GLOBAL_STORAGE_LIMIT) {
      const usedGB = (totalUsed / (1024 * 1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `Storage limit reached (${usedGB}GB / 5GB used). Cannot upload more files.` },
        { status: 507 }
      );
    }

    // Save to local filesystem (dev) — in production, swap to R2
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);
    const url = `/uploads/${filename}`;

    // Track the upload
    await db.prepare(
      "INSERT INTO uploads (user_id, file_key, file_size) VALUES (?, ?, ?)"
    ).bind(auth.userId, filename, file.size).run();

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// GET /api/upload — check storage usage
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initLocalDB();
    const db = await getDB();

    const usage = await db.prepare(
      "SELECT COALESCE(SUM(file_size), 0) as total FROM uploads"
    ).first<{ total: number }>();

    const totalUsed = usage?.total || 0;

    return NextResponse.json({
      used: totalUsed,
      limit: GLOBAL_STORAGE_LIMIT,
      usedFormatted: `${(totalUsed / (1024 * 1024 * 1024)).toFixed(2)}GB`,
      limitFormatted: "5GB",
      percentUsed: Math.round((totalUsed / GLOBAL_STORAGE_LIMIT) * 100),
    });
  } catch {
    return NextResponse.json({ error: "Failed to check storage" }, { status: 500 });
  }
}
