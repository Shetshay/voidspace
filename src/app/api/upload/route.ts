import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDB, getR2, initLocalDB } from "@/lib/db";

const GLOBAL_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB in bytes

export async function POST(req: NextRequest) {
  // Step 1: Auth
  let auth;
  try {
    auth = await getAuthUser();
  } catch (e) {
    return NextResponse.json({ error: "step1_auth_failed", detail: String(e) }, { status: 500 });
  }
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: DB init
  try {
    await initLocalDB();
  } catch (e) {
    return NextResponse.json({ error: "step2_db_init_failed", detail: String(e) }, { status: 500 });
  }

  // Step 3: Get DB
  let db;
  try {
    db = await getDB();
  } catch (e) {
    return NextResponse.json({ error: "step3_get_db_failed", detail: String(e) }, { status: 500 });
  }

  // Step 4: Check storage usage
  let totalUsed = 0;
  try {
    const usage = await db.prepare(
      "SELECT COALESCE(SUM(file_size), 0) as total FROM uploads"
    ).first<{ total: number }>();
    totalUsed = usage?.total || 0;
  } catch (e) {
    return NextResponse.json({ error: "step4_storage_check_failed", detail: String(e) }, { status: 500 });
  }

  // Step 5: Parse form data
  let formData;
  try {
    formData = await req.formData();
  } catch (e) {
    return NextResponse.json({ error: "step5_formdata_failed", detail: String(e) }, { status: 500 });
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
      { error: `Storage limit reached (${usedGB}GB / 5GB used)` },
      { status: 507 }
    );
  }

  // Step 6: Read file buffer
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (e) {
    return NextResponse.json({ error: "step6_read_file_failed", detail: String(e) }, { status: 500 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  let url: string;

  // Step 7: Upload to R2 or local
  const r2 = await getR2();
  if (r2) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (r2 as any).put(key, buffer, {
        httpMetadata: { contentType: file.type },
      });
      url = `/api/media/${key}`;
    } catch (e) {
      return NextResponse.json({ error: "step7_r2_put_failed", detail: String(e) }, { status: 500 });
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
      return NextResponse.json({ error: "step7_local_upload_failed", detail: String(e) }, { status: 500 });
    }
  }

  // Step 8: Track in DB
  try {
    await db.prepare(
      "INSERT INTO uploads (user_id, file_key, file_size) VALUES (?, ?, ?)"
    ).bind(auth.userId, key, file.size).run();
  } catch (e) {
    return NextResponse.json({ error: "step8_db_insert_failed", detail: String(e) }, { status: 500 });
  }

  return NextResponse.json({ url });
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
  } catch (e) {
    return NextResponse.json({ error: "Failed to check storage", detail: String(e) }, { status: 500 });
  }
}
