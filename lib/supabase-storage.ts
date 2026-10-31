import "server-only";

export const photoBucket = process.env.PRODUCT_PHOTO_BUCKET || "depth-dot-products";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase storage is not configured");
  return { storage: `${url.replace(/\/$/, "")}/storage/v1`, key };
}

function headers(key: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

export function publicUrl(path: string) {
  const { storage } = config();
  return `${storage}/object/public/${photoBucket}/${path}`;
}

export async function uploadObject(path: string, body: Buffer, contentType: string) {
  const { storage, key } = config();
  const response = await fetch(`${storage}/object/${photoBucket}/${path}`, {
    method: "POST",
    headers: headers(key, { "Content-Type": contentType, "Cache-Control": "31536000", "x-upsert": "false" }),
    body: new Uint8Array(body),
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status})`);
  return publicUrl(path);
}

export async function removeObjects(paths: string[]) {
  if (!paths.length) return;
  const { storage, key } = config();
  const response = await fetch(`${storage}/object/${photoBucket}`, {
    method: "DELETE",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!response.ok) throw new Error(`Storage delete failed (${response.status})`);
}
