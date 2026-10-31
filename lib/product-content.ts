import "server-only";
import { db } from "@/lib/db";
import { photosBySlug, type ProductPhoto } from "@/lib/product-photos";
import { getProduct, products, type Product } from "@/lib/products";

export type ProductContent = {
  title: string;
  summary: string;
  description: string;
  details: string[];
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  photos: { id: string; alt: string }[];
};

export type LivePhoto = Pick<ProductPhoto, "id" | "url" | "width" | "height"> & { alt: string };
export type LiveProduct = Product & { seoTitle: string; seoDescription: string; keywords: string[]; photos: LivePhoto[]; updatedAt: Date | null };

type ContentRow = {
  product_slug: string;
  draft: Partial<ProductContent> | null;
  published: Partial<ProductContent> | null;
  draft_updated_at: Date | null;
  published_at: Date | null;
};

export const limits = { title: 80, summary: 160, description: 1200, detail: 120, details: 8, seoTitle: 60, seoDescription: 160, keyword: 40, keywords: 12, alt: 140 };

export function defaultContent(product: Product): ProductContent {
  return {
    title: product.title,
    summary: product.summary,
    description: product.description,
    details: product.details,
    seoTitle: "",
    seoDescription: "",
    keywords: [],
    photos: [],
  };
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function list(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => clean(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

export function sanitizeContent(input: unknown, product: Product): ProductContent {
  const body = (input ?? {}) as Record<string, unknown>;
  const photos = Array.isArray(body.photos) ? body.photos : [];
  return {
    title: clean(body.title, limits.title) || product.title,
    summary: clean(body.summary, limits.summary) || product.summary,
    description:
      (typeof body.description === "string" ? body.description.trim().slice(0, limits.description) : "") || product.description,
    details: list(body.details, limits.details, limits.detail),
    seoTitle: clean(body.seoTitle, limits.seoTitle),
    seoDescription: clean(body.seoDescription, limits.seoDescription),
    keywords: list(body.keywords, limits.keywords, limits.keyword),
    photos: photos
      .map((photo) => photo as { id?: unknown; alt?: unknown })
      .filter((photo): photo is { id: string; alt?: unknown } => typeof photo.id === "string" && /^[0-9a-f-]{36}$/i.test(photo.id))
      .slice(0, 100)
      .map((photo) => ({ id: photo.id, alt: clean(photo.alt, limits.alt) })),
  };
}

function merge(product: Product, saved: Partial<ProductContent> | null | undefined): ProductContent {
  const base = defaultContent(product);
  if (!saved) return base;
  return {
    ...base,
    ...Object.fromEntries(Object.entries(saved).filter(([, value]) => value !== "" && value !== null && value !== undefined)),
    details: saved.details?.length ? saved.details : base.details,
  } as ProductContent;
}

async function contentRows({ includeDrafts = false } = {}): Promise<Map<string, ContentRow>> {
  try {
    const result = await db().query<ContentRow>(
      includeDrafts
        ? "SELECT product_slug, draft, published, draft_updated_at, published_at FROM depth_dot.product_content"
        : "SELECT product_slug, NULL::jsonb AS draft, published, NULL::timestamptz AS draft_updated_at, published_at FROM depth_dot.product_content WHERE published IS NOT NULL",
    );
    return new Map(result.rows.map((row) => [row.product_slug, row]));
  } catch (error) {
    console.error("Could not load product content; showing the built-in text.", error);
    return new Map();
  }
}

function orderPhotos(photos: ProductPhoto[], content: ProductContent, title: string): LivePhoto[] {
  const position = new Map(content.photos.map((photo, index) => [photo.id, index]));
  const alts = new Map(content.photos.map((photo) => [photo.id, photo.alt]));
  return [...photos]
    .sort((a, b) => (position.get(a.id) ?? 1000 + a.sort_order) - (position.get(b.id) ?? 1000 + b.sort_order))
    .map((photo, index) => ({
      id: photo.id,
      url: photo.url,
      width: photo.width,
      height: photo.height,
      alt: alts.get(photo.id) || photo.alt || `${title}, photo ${index + 1}`,
    }));
}

function toLive(product: Product, row: ContentRow | undefined, photos: ProductPhoto[]): LiveProduct {
  const content = merge(product, row?.published);
  const livePhotos = orderPhotos(photos, content, content.title);
  return {
    ...product,
    title: content.title,
    summary: content.summary,
    description: content.description,
    details: content.details,
    image: livePhotos[0]?.url ?? product.image,
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    keywords: content.keywords,
    photos: livePhotos,
    updatedAt: row?.published_at ?? null,
  };
}

export async function liveProducts(items: Product[] = products): Promise<LiveProduct[]> {
  const [rows, photos] = await Promise.all([contentRows(), photosBySlug()]);
  return items.map((product) => toLive(product, rows.get(product.slug), photos.get(product.slug) ?? []));
}

export async function liveProduct(slug: string): Promise<LiveProduct | null> {
  const product = getProduct(slug);
  if (!product) return null;
  return (await liveProducts([product]))[0];
}

export async function editorData() {
  const [rows, photos] = await Promise.all([contentRows({ includeDrafts: true }), photosBySlug({ includeDrafts: true })]);
  return products.map((product) => {
    const row = rows.get(product.slug);
    const draft = merge(product, row?.draft ?? row?.published);
    const all = photos.get(product.slug) ?? [];
    return {
      product,
      content: draft,
      photos: orderPhotos(all, draft, draft.title).map((photo) => ({
        ...photo,
        alt: draft.photos.find((item) => item.id === photo.id)?.alt ?? all.find((item) => item.id === photo.id)?.alt ?? "",
        published: all.find((item) => item.id === photo.id)?.published ?? false,
      })),
      hasUnpublished:
        Boolean(row?.draft && JSON.stringify(row.draft) !== JSON.stringify(row.published)) || all.some((photo) => !photo.published),
      publishedAt: row?.published_at?.toISOString() ?? null,
      draftSavedAt: row?.draft_updated_at?.toISOString() ?? null,
    };
  });
}

export async function saveContent(slug: string, content: ProductContent, publish: boolean) {
  await db().query(
    publish
      ? `INSERT INTO depth_dot.product_content (product_slug, draft, published, draft_updated_at, published_at)
         VALUES ($1, $2, $2, now(), now())
         ON CONFLICT (product_slug) DO UPDATE SET draft = $2, published = $2, draft_updated_at = now(), published_at = now()`
      : `INSERT INTO depth_dot.product_content (product_slug, draft, draft_updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (product_slug) DO UPDATE SET draft = $2, draft_updated_at = now()`,
    [slug, JSON.stringify(content)],
  );
}
