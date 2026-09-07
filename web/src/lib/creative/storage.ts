// Server-side Supabase Storage helpers for creative media.

import type { SupabaseClient } from "@supabase/supabase-js";

export const CREATIVE_BUCKET = "creative-assets";

export function mimeToExt(mime: string): string {
  switch (mime.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
}

export function safeAssetName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "creative";
}

export function publicUrl(client: SupabaseClient, bucket: string, path: string): string {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBase64(
  client: SupabaseClient,
  bucket: string,
  path: string,
  dataBase64: string,
  mimeType: string
): Promise<string> {
  const body = Uint8Array.from(atob(dataBase64), (c) => c.charCodeAt(0));
  const { error } = await client.storage.from(bucket).upload(path, body, {
    contentType: mimeType || "image/png",
    upsert: false,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return publicUrl(client, bucket, path);
}