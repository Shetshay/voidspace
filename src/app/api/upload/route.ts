import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDB, getR2, initLocalDB } from "@/lib/db";

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

    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse form data", detail: String(e) }, { status: 400 });
    }

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    if (totalUsed + file.size > GLOBAL_STORAGE_LIMIT) {
      const usedGB = (totalUsed / (1024 * 1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `Storage limit reached (${usedGB}GB / 5GB used). Cannot upload more files.` },
        { status: 507 }
      );
    }

    const ext = file.name.split(".").pop() || "bin";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (e) {
      return NextResponse.json({ error: "Failed to read file", detail: String(e) }, { status: 500 });
    }

    let url: string;

    const r2 = await getR2();
    if (r2) {
      try {
        // R2 put - use the binding directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (r2 as any).put(key, buffer, {
          httpMetadata: { contentType: file.type },
        });
        url = `/api/media/${key}`;
      } catch (e) {
        return NextResponse.json({ error: "R2 upload failed", detail: String(e) }, { status: 500 });
      }
    } else {
      try {
        const { writeFile, mkdir } = await import("fs/promises");
        const path = await import("path");
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });
        const filename = key.replace("uploads/", "");
        await writeFile(path.join(uploadsDir, filename), Buffer.from(buffer));
        url = `/uploads/${filename}`;
      } catch (e) {
        return NextResponse.json({ error: "Local upload failed", detail: String(e) }, { status: 500 });
      }
    }

    try {
      await db.prepare(
        "INSERT INTO uploads (user_id, file_key, file_size) VALUES (?, ?, ?)"
      ).bind(auth.userId, key, file.size).run();
    } catch (e) {
      return NextResponse.json({ error: "Failed to track upload in DB", detail: String(e) }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed", detail: String(error) }, { status: 500 });
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
