import "server-only";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { removeObjects, uploadObject } from "@/lib/supabase-storage";

export type PhotoStyle = "white" | "raw";

export type ProductPhoto = {
  id: string;
  product_slug: string;
  url: string;
  storage_path: string;
  style: PhotoStyle;
  sort_order: number;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string | null;
  published: boolean;
  created_at: Date;
};

const columns = "id, product_slug, url, storage_path, style, sort_order, width, height, bytes, alt, published, created_at";

export async function photosBySlug({ includeDrafts = false } = {}): Promise<Map<string, ProductPhoto[]>> {
  const map = new Map<string, ProductPhoto[]>();
  try {
    const result = await db().query<ProductPhoto>(
      `SELECT ${columns} FROM depth_dot.product_photos
       ${includeDrafts ? "" : "WHERE published"}
       ORDER BY product_slug, sort_order, created_at`,
    );
    for (const row of result.rows) {
      const list = map.get(row.product_slug) ?? [];
      list.push(row);
      map.set(row.product_slug, list);
    }
  } catch (error) {
    console.error("Could not load product photos; showing the default artwork.", error);
  }
  return map;
}

export async function listPhotos(slug: string, { includeDrafts = false } = {}) {
  const result = await db().query<ProductPhoto>(
    `SELECT ${columns} FROM depth_dot.product_photos
     WHERE product_slug = $1 ${includeDrafts ? "" : "AND published"}
     ORDER BY sort_order, created_at`,
    [slug],
  );
  return result.rows;
}

export async function allPhotos() {
  const result = await db().query<ProductPhoto>(
    `SELECT ${columns} FROM depth_dot.product_photos ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function addPhoto(
  slug: string,
  file: Buffer,
  meta: { style: PhotoStyle; width: number | null; height: number | null; alt: string | null; published: boolean },
) {
  const id = randomUUID();
  const path = `${slug}/${id}.webp`;
  const url = await uploadObject(path, file, "image/webp");
  try {
    const result = await db().query<ProductPhoto>(
      `INSERT INTO depth_dot.product_photos (id, product_slug, url, storage_path, style, sort_order, width, height, bytes, alt, published)
       VALUES ($1, $2, $3, $4, $5,
         COALESCE((SELECT max(sort_order) + 1 FROM depth_dot.product_photos WHERE product_slug = $2), 0),
         $6, $7, $8, $9, $10)
       RETURNING ${columns}`,
      [id, slug, url, path, meta.style, meta.width, meta.height, file.length, meta.alt, meta.published],
    );
    return result.rows[0];
  } catch (error) {
    await removeObjects([path]).catch(() => undefined);
    throw error;
  }
}

export async function deletePhoto(id: string, slug?: string) {
  const result = await db().query<{ storage_path: string; product_slug: string }>(
    `DELETE FROM depth_dot.product_photos WHERE id = $1 ${slug ? "AND product_slug = $2" : ""}
     RETURNING storage_path, product_slug`,
    slug ? [id, slug] : [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  await removeObjects([row.storage_path]).catch((error) => console.error("Photo row deleted but file cleanup failed.", error));
  return row.product_slug;
}

export async function savePhotoDetails(slug: string, photos: { id: string; alt: string | null }[], publish: boolean) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    for (const [index, photo] of photos.entries()) {
      await client.query(
        "UPDATE depth_dot.product_photos SET sort_order = $1, alt = $2 WHERE id = $3 AND product_slug = $4",
        [index, photo.alt, photo.id, slug],
      );
    }
    if (publish) {
      await client.query("UPDATE depth_dot.product_photos SET published = true WHERE product_slug = $1", [slug]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
