import { getR2 } from "./db";

interface R2BucketLike {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<unknown>;
}

export async function uploadToR2(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const r2 = await getR2() as R2BucketLike | null;
  if (!r2) throw new Error("R2 not available");

  const ext = file.name.split(".").pop() || "bin";
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const buffer = await file.arrayBuffer();
  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  return key;
}

export async function getFromR2(key: string) {
  const r2 = await getR2() as R2BucketLike | null;
  if (!r2) return null;
  return r2.get(key);
}
