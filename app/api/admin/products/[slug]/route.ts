import { NextResponse } from "next/server";
import { productPaths, refreshProductPages, requireAdmin, unavailable } from "@/lib/admin-api";
import { submitToIndexNow } from "@/lib/indexnow";
import { sanitizeContent, saveContent } from "@/lib/product-content";
import { savePhotoDetails } from "@/lib/product-photos";
import { getProduct } from "@/lib/products";

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { slug } = await context.params;
  const product = getProduct(slug);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { content?: unknown; action?: unknown } | null;
  if (!body || (body.action !== "draft" && body.action !== "publish")) {
    return NextResponse.json({ error: "Choose Save as draft or Publish." }, { status: 400 });
  }
  const publish = body.action === "publish";
  const content = sanitizeContent(body.content, product);

  try {
    if (publish) await savePhotoDetails(product.slug, content.photos, true);
    await saveContent(product.slug, content, publish);
  } catch (cause) {
    return unavailable("Product save", cause);
  }

  if (!publish) return NextResponse.json({ ok: true, published: false });
  refreshProductPages(product);
  const notified = await submitToIndexNow(productPaths(product));
  return NextResponse.json({ ok: true, published: true, notified });
}
