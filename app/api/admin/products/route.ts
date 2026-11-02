import { NextResponse } from "next/server";
import { requireAdmin, refreshProductPages, unavailable, productPaths } from "@/lib/admin-api";
import { submitToIndexNow } from "@/lib/indexnow";
import {
  createCatalogCategory,
  createCatalogProduct,
  findCatalogCategory,
  listCatalogProducts,
  slugify,
  type ProductStore,
} from "@/lib/product-catalog";
import { assertStoreWritable, StoreCapacityError, StoreUnavailableError } from "@/lib/storage";

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as
    | {
        title?: unknown;
        summary?: unknown;
        description?: unknown;
        categorySlug?: unknown;
        newCategory?: { title?: unknown; summary?: unknown } | null;
        store?: unknown;
      }
    | null;
  if (
    !body ||
    typeof body.title !== "string" ||
    typeof body.summary !== "string" ||
    typeof body.description !== "string" ||
    (body.store !== "primary" && body.store !== "atlas")
  ) {
    return NextResponse.json({ error: "Enter the product details and choose a database." }, { status: 400 });
  }
  const store = body.store as ProductStore;
  try {
    await assertStoreWritable(store);
    const slug = slugify(body.title);
    if (!slug) return NextResponse.json({ error: "Enter a product name using letters or numbers." }, { status: 400 });
    if ((await listCatalogProducts(true)).some((product) => product.slug === slug)) {
      return NextResponse.json({ error: "A product with that name already exists." }, { status: 409 });
    }
    let category;
    if (body.newCategory) {
      if (typeof body.newCategory.title !== "string" || typeof body.newCategory.summary !== "string") {
        return NextResponse.json({ error: "Enter a valid new category." }, { status: 400 });
      }
      category = await createCatalogCategory({
        title: body.newCategory.title,
        summary: body.newCategory.summary,
        store,
      });
    } else if (typeof body.categorySlug === "string") {
      category = await findCatalogCategory(body.categorySlug);
      if (!category) return NextResponse.json({ error: "Choose an available category." }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Choose a category or create a new one." }, { status: 400 });
    }

    const product = await createCatalogProduct({
      title: body.title,
      summary: body.summary,
      description: body.description,
      category,
      store,
    });
    refreshProductPages(product);
    const notified = await submitToIndexNow(productPaths(product));
    return NextResponse.json({ ok: true, slug: product.slug, store, notified });
  } catch (cause) {
    if (cause instanceof StoreCapacityError) return NextResponse.json({ error: cause.message }, { status: 507 });
    if (cause instanceof StoreUnavailableError) return NextResponse.json({ error: cause.message }, { status: 503 });
    if (cause instanceof Error && /^(Enter |A category |A product |MongoDB is not configured)/.test(cause.message)) {
      return NextResponse.json({ error: cause.message }, { status: 400 });
    }
    return unavailable("Product creation", cause);
  }
}
