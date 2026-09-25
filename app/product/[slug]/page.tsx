import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { getProduct, products } from "@/lib/products";

export const dynamic = "force-static";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const product = getProduct(slug);
    if (!product) return { title: "Product" };
    return { title: product.title, description: product.summary };
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const categorySlug = product.category === "3D print" ? "3d-print" : product.category.toLowerCase();

  return (
    <article className="wrap page">
      <Link className="text-link" href={`/product/c/${categorySlug}`}>{product.category}</Link>
      <p className="kicker">{product.category}</p>
      <h1>{product.title}</h1>
      <p className="lead">{product.description}</p>
      <ProductGallery
        items={product.pieces.map((piece) => ({
          slug: piece.slug,
          title: piece.title,
          category: product.category,
          summary: piece.summary,
          image: piece.image,
        }))}
      />
      <div className="facts">
        {product.details.map((detail) => (
          <p key={detail}>{detail}</p>
        ))}
        <Link
          className="text-link"
          href={`/inquire?interest=${encodeURIComponent(product.title)}&from=${encodeURIComponent(`/product/${product.slug}`)}&label=${encodeURIComponent(`Product · ${product.title}`)}`}
        >
          Inquire about this
        </Link>
      </div>
    </article>
  );
}
