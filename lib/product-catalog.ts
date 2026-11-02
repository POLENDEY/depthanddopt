import "server-only";
import { mongo, mongoConfigured } from "@/lib/mongo";
import { db } from "@/lib/db";
import { categories as builtInCategories, getProduct, products as builtInProducts, type Product } from "@/lib/products";
import type { ProductContent } from "@/lib/product-content";

export type ProductStore = "primary" | "atlas";
export type CatalogCategory = { slug: string; title: string; summary: string; image: string };

type ProductRow = {
  slug: string;
  category_slug: string;
  category: string;
  draft: ProductContent | null;
  published: ProductContent | null;
  draft_updated_at: Date | null;
  published_at: Date | null;
};

type CategoryRow = { slug: string; title: string; summary: string; image: string };

const customCategoryImage = "/images/desk.svg";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function categoryFromRow(row: CategoryRow): CatalogCategory {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    image: row.image || customCategoryImage,
  };
}

function productFromRow(row: ProductRow, includeDrafts: boolean): Product | null {
  const content = includeDrafts ? row.draft ?? row.published : row.published;
  if (!content) return null;
  return {
    slug: row.slug,
    title: content.title,
    category: row.category,
    summary: content.summary,
    description: content.description,
    image: customCategoryImage,
    details: content.details,
    pieces: [],
    store: "primary",
    custom: true,
  };
}

async function primaryCategories(): Promise<CatalogCategory[]> {
  const result = await db().query<CategoryRow>(
    "SELECT slug, title, summary, image FROM depth_dot.custom_categories ORDER BY title",
  );
  return result.rows.map(categoryFromRow);
}

async function atlasCategories(): Promise<CatalogCategory[]> {
  if (!mongoConfigured()) return [];
  const docs = await (await mongo()).collection<CategoryRow>("custom_categories").find().sort({ title: 1 }).toArray();
  return docs.map(categoryFromRow);
}

async function primaryProducts(includeDrafts: boolean): Promise<Product[]> {
  const result = await db().query<ProductRow>(
    `SELECT slug, category_slug, category, ${includeDrafts ? "draft" : "NULL::jsonb AS draft"},
            published, draft_updated_at, published_at
     FROM depth_dot.custom_products ${includeDrafts ? "" : "WHERE published IS NOT NULL"}
     ORDER BY slug`,
  );
  return result.rows
    .map((row) => productFromRow(row, includeDrafts))
    .filter((product): product is Product => product !== null);
}

async function atlasProducts(includeDrafts: boolean): Promise<Product[]> {
  if (!mongoConfigured()) return [];
  const docs = await (await mongo())
    .collection<ProductRow & { _id: string }>("custom_products")
    .find(includeDrafts ? {} : { published: { $ne: null } })
    .project<ProductRow>({ _id: 0 })
    .sort({ slug: 1 })
    .toArray();
  const products: Product[] = [];
  for (const row of docs) {
    const product = productFromRow(row, includeDrafts);
    if (product) products.push({ ...product, store: "atlas" });
  }
  return products;
}

export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  const results = await Promise.allSettled([primaryCategories(), atlasCategories()]);
  const custom = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`Could not load custom categories from ${index === 0 ? "Supabase" : "MongoDB"}.`, result.reason);
    return [];
  });
  const bySlug = new Map([...builtInCategories, ...custom].map((category) => [category.slug, category]));
  return [...bySlug.values()];
}

export async function listCatalogProducts(includeDrafts = false): Promise<Product[]> {
  const results = await Promise.allSettled([primaryProducts(includeDrafts), atlasProducts(includeDrafts)]);
  const custom = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`Could not load custom products from ${index === 0 ? "Supabase" : "MongoDB"}.`, result.reason);
    return [];
  });
  return [...builtInProducts, ...custom];
}

export async function findCatalogProduct(slug: string, includeDrafts = false): Promise<Product | undefined> {
  const builtIn = getProduct(slug);
  if (builtIn) return builtIn;
  const products = await listCatalogProducts(includeDrafts);
  return products.find((product) => product.slug === slug);
}

export async function findCatalogCategory(slug: string): Promise<CatalogCategory | undefined> {
  const categories = await listCatalogCategories();
  return categories.find((category) => category.slug === slug);
}

export async function createCatalogCategory(input: { title: string; summary: string; store: ProductStore }) {
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 80);
  const summary = input.summary.trim().replace(/\s+/g, " ").slice(0, 160);
  const slug = slugify(title);
  if (!title || !slug) throw new Error("Enter a category name using letters or numbers.");
  if (input.store === "atlas" && !mongoConfigured()) throw new Error("MongoDB is not configured.");
  if ((await listCatalogCategories()).some((category) => category.slug === slug)) {
    throw new Error("A category with that name already exists.");
  }
  const category = { slug, title, summary, image: customCategoryImage };
  if (input.store === "primary") {
    await db().query(
      "INSERT INTO depth_dot.custom_categories (slug, title, summary, image) VALUES ($1, $2, $3, $4)",
      [category.slug, category.title, category.summary, category.image],
    );
  } else {
    await (await mongo()).collection<CategoryRow & { _id: string }>("custom_categories").insertOne({ _id: slug, ...category });
  }
  return category;
}

export async function createCatalogProduct(input: {
  title: string;
  summary: string;
  description: string;
  category: CatalogCategory;
  store: ProductStore;
}) {
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 80);
  const slug = slugify(title);
  if (!title || !slug) throw new Error("Enter a product name using letters or numbers.");
  if (input.store === "atlas" && !mongoConfigured()) throw new Error("MongoDB is not configured.");
  if ((await listCatalogProducts(true)).some((product) => product.slug === slug)) {
    throw new Error("A product with that name already exists.");
  }
  const content: ProductContent = {
    title,
    summary: input.summary.trim().replace(/\s+/g, " ").slice(0, 160),
    description: input.description.trim().slice(0, 1200),
    details: [],
    seoTitle: "",
    seoDescription: "",
    keywords: [],
    photos: [],
  };
  const row = {
    slug,
    category_slug: input.category.slug,
    category: input.category.title,
    draft: content,
    published: content,
    draft_updated_at: new Date(),
    published_at: new Date(),
  };
  if (input.store === "primary") {
    await db().query(
      `INSERT INTO depth_dot.custom_products (slug, category_slug, category, draft, published, draft_updated_at, published_at)
       VALUES ($1, $2, $3, $4, $4, now(), now())`,
      [slug, input.category.slug, input.category.title, JSON.stringify(content)],
    );
  } else {
    await (await mongo()).collection<ProductRow & { _id: string }>("custom_products").insertOne({ _id: slug, ...row });
  }
  return { ...productFromRow(row, true)!, store: input.store, custom: true };
}

export async function customProductStatus(slug: string, store: ProductStore) {
  if (store === "primary") {
    const result = await db().query<Pick<ProductRow, "draft" | "published" | "draft_updated_at" | "published_at">>(
      "SELECT draft, published, draft_updated_at, published_at FROM depth_dot.custom_products WHERE slug = $1",
      [slug],
    );
    return result.rows[0] ?? null;
  }
  const result = await (await mongo()).collection<ProductRow & { _id: string }>("custom_products").findOne({ _id: slug });
  if (!result) return null;
  return {
    draft: result.draft,
    published: result.published,
    draft_updated_at: result.draft_updated_at,
    published_at: result.published_at,
  };
}

export async function saveCatalogProduct(
  product: Product,
  content: ProductContent,
  publish: boolean,
) {
  if (!product.custom || !product.store) throw new Error("This is not a custom product.");
  if (product.store === "primary") {
    await db().query(
      publish
        ? `UPDATE depth_dot.custom_products
           SET draft = $2, published = $2, draft_updated_at = now(), published_at = now()
           WHERE slug = $1`
        : `UPDATE depth_dot.custom_products SET draft = $2, draft_updated_at = now() WHERE slug = $1`,
      [product.slug, JSON.stringify(content)],
    );
  } else {
    const result = await (await mongo()).collection<ProductRow & { _id: string }>("custom_products").updateOne(
      { _id: product.slug },
      {
        $set: publish
          ? { draft: content, published: content, draft_updated_at: new Date(), published_at: new Date() }
          : { draft: content, draft_updated_at: new Date() },
      },
    );
    if (!result.matchedCount) throw new Error("Product not found.");
  }
}
