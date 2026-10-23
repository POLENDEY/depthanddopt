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
    <>
      <section className="hero catalog-hero" aria-label="Catalog introduction and 3D preview">
        <div className="wrap catalog-hero-inner">
          <div className="hero-copy">
            <Breadcrumbs items={[{ label: "Index", href: "/" }, { label: "Catalog" }]} />
            <p className="catalog-eyebrow">Studio Catalog &bull; 2026</p>
            <h1 className="catalog-title">Products &amp; Objects</h1>
            <p className="hero-lead">
              Tactile 3D printed keychains, personal objects, and studio print work. Engineered with solid pigments, geometric type, and durable matte finishes.
            </p>
            <div className="hero-actions">
              <a className="hero-discover" href="#directory">
                <span>Browse all</span>
                <span className="hero-discover-dots" aria-hidden="true" />
              </a>
              <span className="hero-actions-rule" aria-hidden="true" />
              <Link className="hero-connect" href="/inquire">
                <span className="hero-round">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
                <span>Start an inquiry</span>
              </Link>
            </div>
          </div>

          <div className="catalog-hero-reel">
            <ObjectReel />
          </div>
        </div>

        <div className="hero-bar">
          <nav className="wrap catalog-bar-inner" aria-label="Collections">
            {categories.map((c, i) => (
              <Link key={c.slug} href={`/product/c/${c.slug}`} className="catalog-bar-link">
                <span className="hero-note-index">{i + 1}</span>
                <span>
                  <strong>{c.title}</strong>
                  <small>{c.summary}</small>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="wrap page aesthetic-product-page" id="directory">
        <section className="aesthetic-directory-section" aria-label="Product directory">
          <div className="aesthetic-section-head">
            <h2 className="aesthetic-section-title">Directory</h2>
            <span className="aesthetic-section-count">{products.length} items</span>
          </div>

          <ProductCatalog products={products} categories={categories} />
        </section>
      </div>
    </>
  );
}
