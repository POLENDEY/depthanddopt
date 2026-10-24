import type { Metadata } from "next";
import type { Product } from "@/lib/products";
import { ogImage, siteName } from "@/lib/site";

export const categoryPhrase: Record<Product["category"], string> = {
  "3D print": "Custom 3D print",
  Personal: "Personalized gift",
  Print: "Custom print",
};

export const shippingNote = "Made to order in Quezon City and shipped across the Philippines.";

export function pageMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
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
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteName}`,
      description,
      images: [ogImage.url],
    },
  };
}
