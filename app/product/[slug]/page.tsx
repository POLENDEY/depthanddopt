import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumb";
import { ProductGallery } from "@/components/product-gallery";
import { getProduct, getCategorySlug, getRelatedProducts, products } from "@/lib/products";

export const dynamic = "force-static";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const product = getProduct(slug);
    if (!product) return { title: "Product" };
    return { title: `${product.title} · Products`, description: product.summary };
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const categorySlug = getCategorySlug(product.category);
  const related = getRelatedProducts(product.slug, 3);

  return (
    <article className="wrap page aesthetic-product-detail-page">
      <Breadcrumbs
        items={[
          { label: "Index", href: "/" },
          { label: "Catalog", href: "/product" },
          { label: product.category, href: `/product/c/${categorySlug}` },
          { label: product.title },
        ]}
      />

      {/* Product Detail Header */}
      <header className="aesthetic-detail-header">
        <div className="detail-header-copy">
          <p className="aesthetic-eyebrow">
            <Link href={`/product/c/${categorySlug}`}>{product.category}</Link>
            <span>&bull;</span>
            <span>{product.pieces.length} variations</span>
          </p>

          <h1 className="aesthetic-detail-title">{product.title}</h1>
          <p className="aesthetic-detail-lead">{product.description}</p>
        </div>

        <div className="aesthetic-detail-actions">
          <Link
            className="button"
            href={`/inquire?interest=${encodeURIComponent(product.title)}&from=${encodeURIComponent(`/product/${product.slug}`)}&label=${encodeURIComponent(`Product · ${product.title}`)}`}
          >
            Start an inquiry
          </Link>
          <Link className="aesthetic-back-link" href={`/product/c/${categorySlug}`}>
            View {product.category} collection &rarr;
          </Link>
        </div>
      </header>

      {/* Variations & Styles Gallery Section */}
      <section className="aesthetic-variations-section" aria-label="Product variations gallery">
        <div className="aesthetic-section-head">
          <h2 className="aesthetic-section-title">Variations &amp; Pieces</h2>
          <span className="aesthetic-section-count">{product.pieces.length} styles</span>
        </div>

        <ProductGallery
          items={product.pieces.map((piece) => ({
            slug: piece.slug,
            title: piece.title,
            category: product.category,
            summary: piece.summary,
            image: piece.image,
          }))}
        />
      </section>

      {/* Specifications & Craft Details */}
      <section className="aesthetic-specs-section" aria-label="Product specifications">
        <div className="aesthetic-section-head">
          <h2 className="aesthetic-section-title">Specifications &amp; Details</h2>
        </div>

        <div className="aesthetic-specs-list">
          {product.details.map((detail, index) => (
            <div className="aesthetic-spec-item" key={index}>
              <span className="spec-item-num">0{index + 1}</span>
              <p className="spec-item-text">{detail}</p>
            </div>
          ))}
          <div className="aesthetic-spec-item custom-notice">
            <span className="spec-item-num">&bull;</span>
            <p className="spec-item-text">
              Custom lettering, sizing, or batch orders welcome via inquiry.
            </p>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="aesthetic-related-section" aria-label="Related products">
          <div className="aesthetic-section-head">
            <h2 className="aesthetic-section-title">More in {product.category}</h2>
            <Link className="text-link" href={`/product/c/${categorySlug}`}>
              All in collection &rarr;
            </Link>
          </div>

          <div className="aesthetic-grid">
            {related.map((item) => (
              <article className="aesthetic-card" key={item.slug}>
                <Link href={`/product/${item.slug}`} className="card-image-wrap">
                  <img src={item.image} alt="" width={800} height={800} loading="lazy" className="card-image" />
                  <span className="card-badge">{item.category}</span>
                </Link>
                <div className="card-meta">
                  <h3 className="card-heading">
                    <Link href={`/product/${item.slug}`}>{item.title}</Link>
                  </h3>
                  <p className="card-summary">{item.summary}</p>
                  <div className="card-bottom">
                    <Link href={`/product/${item.slug}`} className="card-explore-link">
                      <span>View piece</span>
                      <span className="arrow">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
