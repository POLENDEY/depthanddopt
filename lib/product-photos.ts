import "server-only";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { mongo, mongoConfigured } from "@/lib/mongo";
import type { ProductStore } from "@/lib/product-catalog";
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
  store?: ProductStore;
};

const columns = "id, product_slug, url, storage_path, style, sort_order, width, height, bytes, alt, published, created_at";

export async function photosBySlug({ includeDrafts = false } = {}): Promise<Map<string, ProductPhoto[]>> {
  const map = new Map<string, ProductPhoto[]>();
  const results = await Promise.allSettled([
    (async () =>
      db().query<ProductPhoto>(
        `SELECT ${columns} FROM depth_dot.product_photos
         ${includeDrafts ? "" : "WHERE published"}
         ORDER BY product_slug, sort_order, created_at`,
      ))(),
    mongoConfigured()
      ? (async () => {
          const query = includeDrafts ? {} : { published: true };
          return (await (await mongo()).collection<ProductPhoto>("product_photos")
            .find(query)
            .project<ProductPhoto>({ _id: 0 })
            .sort({ product_slug: 1, sort_order: 1, created_at: 1 })
            .toArray())
            .map((photo) => ({ ...photo, store: "atlas" as const }));
        })()
      : Promise.resolve([] as ProductPhoto[]),
  ]);
  if (results[0].status === "fulfilled") {
    for (const row of results[0].value.rows) {
      const list = map.get(row.product_slug) ?? [];
      list.push({ ...row, store: "primary" });
      map.set(row.product_slug, list);
    }
  } else {
    console.error("Could not load product photos from Supabase.", results[0].reason);
  }
  if (results[1].status === "fulfilled") {
    for (const row of results[1].value) {
      const list = map.get(row.product_slug) ?? [];
      list.push(row);
      map.set(row.product_slug, list);
    }
  } else {
    console.error("Could not load product photos from MongoDB.", results[1].reason);
  }
  return map;
}

export async function listPhotos(slug: string, { includeDrafts = false } = {}): Promise<ProductPhoto[]> {
  const [primaryResult, atlasResult] = await Promise.allSettled([
    (async () =>
      db().query<ProductPhoto>(
        `SELECT ${columns} FROM depth_dot.product_photos
         WHERE product_slug = $1 ${includeDrafts ? "" : "AND published"}
         ORDER BY sort_order, created_at`,
        [slug],
      ))(),
    mongoConfigured()
      ? (async () =>
          (await (await mongo()).collection<ProductPhoto>("product_photos")
            .find({ product_slug: slug, ...(includeDrafts ? {} : { published: true }) })
            .project<ProductPhoto>({ _id: 0 })
            .sort({ sort_order: 1, created_at: 1 })
            .toArray())
            .map((photo) => ({ ...photo, store: "atlas" as const })))()
      : Promise.resolve([] as ProductPhoto[]),
  ]);
  if (primaryResult.status === "rejected" && atlasResult.status === "rejected") {
    throw new AggregateError([primaryResult.reason, atlasResult.reason], "Could not read product photos from either database.");
  }
  if (primaryResult.status === "rejected") console.error("Could not read product photos from Supabase.", primaryResult.reason);
  if (atlasResult.status === "rejected") console.error("Could not read product photos from MongoDB.", atlasResult.reason);
  return [
    ...(primaryResult.status === "fulfilled" ? primaryResult.value.rows.map((photo) => ({ ...photo, store: "primary" as const })) : []),
    ...(atlasResult.status === "fulfilled" ? atlasResult.value : []),
  ].sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function allPhotos() {
  const [primary, atlas] = await Promise.allSettled([
    (async () =>
      db().query<ProductPhoto>(`SELECT ${columns} FROM depth_dot.product_photos ORDER BY created_at DESC`))(),
    mongoConfigured()
      ? (async () =>
          (await (await mongo()).collection<ProductPhoto>("product_photos")
            .find()
            .project<ProductPhoto>({ _id: 0 })
            .sort({ created_at: -1 })
            .toArray())
            .map((photo) => ({ ...photo, store: "atlas" as const })))()
      : Promise.resolve([] as ProductPhoto[]),
  ]);
  if (primary.status === "rejected" && atlas.status === "rejected") {
    throw new AggregateError([primary.reason, atlas.reason], "Could not load photos from either database.");
  }
  if (primary.status === "rejected") console.error("Could not load photos from Supabase.", primary.reason);
  if (atlas.status === "rejected") console.error("Could not load photos from MongoDB.", atlas.reason);
  return [
    ...(primary.status === "fulfilled" ? primary.value.rows.map((photo) => ({ ...photo, store: "primary" as const })) : []),
    ...(atlas.status === "fulfilled" ? atlas.value : []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addPhoto(
  slug: string,
  file: Buffer,
  meta: { style: PhotoStyle; width: number | null; height: number | null; alt: string | null; published: boolean },
  store: ProductStore = "primary",
) {
  const id = randomUUID();
  if (store === "atlas") {
    const database = await mongo();
    const bucket = new GridFSBucket(database, { bucketName: "product_photos" });
    const upload = bucket.openUploadStream(`${id}.webp`, { contentType: "image/webp", metadata: { photoId: id } });
    try {
      await new Promise<void>((resolve, reject) => {
        Readable.from([file]).pipe(upload).on("error", reject).on("finish", resolve);
      });
      const photo: ProductPhoto = {
        id,
        product_slug: slug,
        url: `/api/product-photos/${id}`,
        storage_path: String(upload.id),
        style: meta.style,
        sort_order: 0,
        width: meta.width,
        height: meta.height,
        bytes: file.length,
        alt: meta.alt,
        published: meta.published,
        created_at: new Date(),
        store: "atlas",
      };
      await database.collection<ProductPhoto & { _id: string }>("product_photos").insertOne({ _id: id, ...photo });
      return photo;
    } catch (error) {
      if (upload.id) await bucket.delete(upload.id).catch((cleanupError) => console.error("Could not clean up an incomplete MongoDB photo upload.", cleanupError));
      throw error;
    }
  }
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
    return { ...result.rows[0], store: "primary" as const };
  } catch (error) {
    await removeObjects([path]).catch(() => undefined);
    throw error;
  }
}

export async function deletePhoto(id: string, slug?: string) {
  let atlasError: unknown;
  if (mongoConfigured()) {
    try {
      const database = await mongo();
      const photos = database.collection<ProductPhoto & { _id: string }>("product_photos");
      const atlasPhoto = await photos.findOne({ _id: id, ...(slug ? { product_slug: slug } : {}) });
      if (atlasPhoto) {
        await photos.deleteOne({ _id: id });
        const bucket = new GridFSBucket(database, { bucketName: "product_photos" });
        await bucket.delete(new ObjectId(atlasPhoto.storage_path));
        return atlasPhoto.product_slug;
      }
    } catch (error) {
      atlasError = error;
    }
  }
  let result;
  try {
    result = await db().query<{ storage_path: string; product_slug: string }>(
      `DELETE FROM depth_dot.product_photos WHERE id = $1 ${slug ? "AND product_slug = $2" : ""}
       RETURNING storage_path, product_slug`,
      slug ? [id, slug] : [id],
    );
  } catch (error) {
    if (atlasError) throw new AggregateError([atlasError, error], "Could not delete the photo from either database.");
    throw error;
  }
  const row = result.rows[0];
  if (!row && atlasError) throw new AggregateError([atlasError], "Could not check the MongoDB photo record.");
  if (!row) return null;
  await removeObjects([row.storage_path]).catch((error) => console.error("Photo row deleted but file cleanup failed.", error));
  return row.product_slug;
}

export async function savePhotoDetails(slug: string, photos: { id: string; alt: string | null }[], publish: boolean) {
  const existing = await listPhotos(slug, { includeDrafts: true });
  const primary = existing.filter((photo) => photo.store !== "atlas");
  const atlas = existing.filter((photo) => photo.store === "atlas");
  if (primary.length) {
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      for (const [index, photo] of photos.entries()) {
        if (!primary.some((saved) => saved.id === photo.id)) continue;
        await client.query(
          "UPDATE depth_dot.product_photos SET sort_order = $1, alt = $2 WHERE id = $3 AND product_slug = $4",
          [index, photo.alt, photo.id, slug],
        );
      }
      if (publish) await client.query("UPDATE depth_dot.product_photos SET published = true WHERE product_slug = $1", [slug]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  if (atlas.length) {
    const collection = (await mongo()).collection<ProductPhoto & { _id: string }>("product_photos");
    for (const [index, photo] of photos.entries()) {
      if (!atlas.some((saved) => saved.id === photo.id)) continue;
      await collection.updateOne(
        { _id: photo.id, product_slug: slug },
        { $set: { sort_order: index, alt: photo.alt, ...(publish ? { published: true } : {}) } },
      );
    }
  }
}

export async function mongoPhoto(id: string, allowDraft: boolean) {
  const database = await mongo();
  const photo = await database.collection<ProductPhoto & { _id: string }>("product_photos").findOne({
    _id: id,
    ...(allowDraft ? {} : { published: true }),
  });
  if (!photo) return null;
  const bucket = new GridFSBucket(database, { bucketName: "product_photos" });
  const stream = bucket.openDownloadStream(new ObjectId(photo.storage_path));
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
