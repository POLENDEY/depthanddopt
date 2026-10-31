import type { MetadataRoute } from "next";
import { liveProducts } from "@/lib/product-content";
import { categories } from "@/lib/products";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const products = await liveProducts();
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      images: [`${base}/og.jpg`, `${base}/images/banner-keychains.webp`],
    },
    { url: `${base}/product`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/inquire`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...categories.map((category) => ({
      url: `${base}/product/c/${category.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: product.photos.length ? product.photos.map((photo) => photo.url) : undefined,
    })),
  ];
}
