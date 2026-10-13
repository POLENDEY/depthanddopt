import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumb";
import { ObjectReel } from "@/components/object-reel";
import { ProductCatalog } from "@/components/product-catalog";
import { categories, products } from "@/lib/products";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Products & Objects",
  description: "Browse custom 3D printed keychains, personal objects, and studio goods from Depth & Dot.",
};

export default function ProductIndexPage() {
  return (
    <div className="wrap page aesthetic-product-page">
      <Breadcrumbs items={[{ label: "Index", href: "/" }, { label: "Catalog" }]} />

      {/* Minimalist Hero: Typography + 3D Object Pedestal */}
      <section className="aesthetic-hero" aria-label="Catalog introduction and 3D preview">
        <div className="aesthetic-hero-copy">
          <p className="aesthetic-eyebrow">Studio Catalog &bull; 2026</p>
          <h1 className="aesthetic-title">Products &amp; Objects</h1>
          <p className="aesthetic-lead">
            Tactile 3D printed keychains, personal objects, and studio print work. Engineered with solid pigments, geometric type, and durable matte finishes.
          </p>

          <div className="aesthetic-hero-nav">
            <span className="hero-nav-label">Collections</span>
            <div className="hero-nav-links">
              {categories.map((c) => (
                <Link key={c.slug} href={`/product/c/${c.slug}`} className="hero-nav-item">
                  <span>{c.title}</span>
                  <span className="nav-arrow">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="aesthetic-hero-pedestal-wrap">
          <ObjectReel />
        </div>
      </section>

      {/* Thin elegant separator */}
      <div className="aesthetic-divider" aria-hidden="true" />

      {/* Complete Product Directory */}
      <section className="aesthetic-directory-section" aria-label="Product directory">
        <div className="aesthetic-section-head">
          <h2 className="aesthetic-section-title">Directory</h2>
          <span className="aesthetic-section-count">{products.length} items</span>
        </div>

        <ProductCatalog products={products} categories={categories} />
      </section>
    </div>
  );
}
