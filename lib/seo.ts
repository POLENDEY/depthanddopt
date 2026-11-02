import type { Metadata } from "next";
import type { Product } from "@/lib/products";
import { ogImage, siteName } from "@/lib/site";

const categoryPhrases: Record<string, string> = {
  "3D print": "Custom 3D print",
  Personal: "Personalized gift",
  Print: "Custom print",
};

export function phraseForCategory(category: Product["category"]) {
  return categoryPhrases[category] ?? `Custom ${category}`;
}

export const shippingNote = "Made to order in Quezon City and shipped across the Philippines.";

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  image,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: { url: string; width?: number; height?: number; alt: string };
}): Metadata {
  const shareImage = image ?? ogImage;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_PH",
      siteName,
      url: path,
      title: `${title} · ${siteName}`,
      description,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteName}`,
      description,
      images: [shareImage.url],
    },
  };
}
