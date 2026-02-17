import { NextRequest, NextResponse } from "next/server";
import { getR2 } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const fileKey = key.join("/");

    const r2 = await getR2();
    if (!r2) {
      return NextResponse.json({ error: "Storage not available" }, { status: 503 });
    }

    const object = await (r2 as { get: (key: string) => Promise<{
      body: ReadableStream;
      httpMetadata?: { contentType?: string };
      size: number;
    } | null> }).get(fileKey);

    if (!object) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Content-Length", String(object.size));
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(object.body, { headers });
  } catch (error) {
    console.error("Media serve error:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
