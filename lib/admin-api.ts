import "server-only";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth";
import { getCategorySlug, type Product } from "@/lib/products";

export async function requireAdmin() {
  const session = await readSession((await cookies()).get(sessionCookie)?.value);
  return Boolean(session);
}

export function unavailable(action: string, cause: unknown) {
  console.error(`${action} failed.`, cause);
  return NextResponse.json({ error: "The database could not be reached. Try again shortly." }, { status: 503 });
}

export function productPaths(product: Product) {
  return ["/", "/product", `/product/${product.slug}`, `/product/c/${getCategorySlug(product.category)}`];
}

export function refreshProductPages(product: Product) {
  for (const path of productPaths(product)) revalidatePath(path);
  revalidatePath("/sitemap.xml");
}
