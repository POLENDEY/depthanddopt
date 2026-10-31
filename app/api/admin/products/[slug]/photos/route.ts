import { NextResponse } from "next/server";
import { refreshProductPages, requireAdmin, unavailable } from "@/lib/admin-api";
import { limits } from "@/lib/product-content";
import { addPhoto, deletePhoto, listPhotos } from "@/lib/product-photos";
import { getProduct } from "@/lib/products";

const maxBytes = 4 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolve(context: { params: Promise<{ slug: string }> }) {
  if (!(await requireAdmin())) return { error: NextResponse.json({ error: "Sign in again." }, { status: 401 }) };
  const { slug } = await context.params;
  const product = getProduct(slug);
  if (!product) return { error: NextResponse.json({ error: "Product not found." }, { status: 404 }) };
  return { product };
}

function isWebp(buffer: Buffer) {
  return buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}

function dimension(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 10000 ? number : null;
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { product, error } = await resolve(context);
  if (error) return error;
  try {
    return NextResponse.json({ photos: await listPhotos(product.slug, { includeDrafts: true }) });
  } catch (cause) {
    return unavailable("Photo list", cause);
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { product, error } = await resolve(context);
  if (error) return error;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > maxBytes) return NextResponse.json({ error: "That image is over 4 MB after processing." }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isWebp(buffer)) return NextResponse.json({ error: "The processed image was not a WebP file." }, { status: 400 });

  const published = form?.get("publish") === "true";
  const alt = String(form?.get("alt") ?? "").replace(/\s+/g, " ").trim().slice(0, limits.alt) || null;
  try {
    const photo = await addPhoto(product.slug, buffer, {
      style: form?.get("style") === "raw" ? "raw" : "white",
      width: dimension(form?.get("width") ?? null),
      height: dimension(form?.get("height") ?? null),
      alt,
      published,
    });
    if (published) refreshProductPages(product);
    return NextResponse.json({ photo });
  } catch (cause) {
    return unavailable("Photo upload", cause);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { product, error } = await resolve(context);
  if (error) return error;
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof body.id !== "string" || !uuidPattern.test(body.id)) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }
  try {
    if (!(await deletePhoto(body.id, product.slug))) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  } catch (cause) {
    return unavailable("Photo delete", cause);
  }
  refreshProductPages(product);
  return NextResponse.json({ ok: true });
}
