import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumb";
import { JsonLd } from "@/components/json-ld";
import { categories, getCategory, productsInCategory } from "@/lib/products";
import { categoryPhrase, pageMetadata, shippingNote } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const category = getCategory(slug);
    if (!category) return { title: "Product" };
    const items = productsInCategory(category.title);
    return pageMetadata({
      title: `${categoryPhrase[category.title]} collection`,
      description: `${category.summary} Browse ${items.map((item) => item.title).join(", ")}. ${shippingNote}`,
      path: `/product/c/${category.slug}`,
    });
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const items = productsInCategory(category.title);
  const otherCategories = categories.filter((c) => c.slug !== category.slug);
  const base = siteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.title} collection`,
    description: category.summary,
    url: `${base}/product/c/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${base}/product/${item.slug}`,
        name: item.title,
      })),
    },
  };

  return (
    <section className="wrap page aesthetic-category-page">
      <JsonLd data={schema} />
      <Breadcrumbs
        items={[
          { label: "Index", href: "/" },
          { label: "Catalog", href: "/product" },
          { label: category.title },
        ]}
      />

      {/* Minimalist Switcher */}
      <div className="aesthetic-category-switcher" aria-label="Collections switcher">
        <Link href="/product" className="aesthetic-switch-link">
          All
        </Link>
        {categories.map((c) => {
          const isCurrent = c.slug === category.slug;
          return (
            <Link
              key={c.slug}
              href={`/product/c/${c.slug}`}
              className={`aesthetic-switch-link ${isCurrent ? "active" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
            >
              {c.title}
            </Link>
          );
        })}
      </div>

      {/* Header */}
      <header className="aesthetic-category-header">
        <div>
          <p className="aesthetic-eyebrow">Collection</p>
          <h1 className="aesthetic-category-title">{category.title}</h1>
          <p className="aesthetic-category-lead">{category.summary}</p>
        </div>
        <div className="aesthetic-category-meta">
          <span className="aesthetic-count-pill">{items.length} items</span>
          <Link
            className="button secondary"
            href={`/inquire?interest=${encodeURIComponent(items[0]?.title || "Something else")}&from=${encodeURIComponent(`/product/c/${category.slug}`)}&label=${encodeURIComponent(`Product · ${category.title}`)}`}
          >
            Inquire about collection
          </Link>
        </div>
      </header>

      {/* Minimalist Grid */}
      <div className="aesthetic-grid">
        {items.map((item) => (
          <article className="aesthetic-card" key={item.slug}>
            <Link href={`/product/${item.slug}`} className="card-image-wrap">
              <img
                src={item.image}
                alt={item.title}
                width={800}
                height={800}
                loading="lazy"
                className="card-image"
              />
              <span className="card-badge">{item.category}</span>
            </Link>

            <div className="card-meta">
              <div className="card-eyebrow">
                <span>{item.pieces.length} variations</span>
              </div>

              <h3 className="card-heading">
                <Link href={`/product/${item.slug}`}>{item.title}</Link>
              </h3>

              <p className="card-summary">{item.summary}</p>

              {item.pieces && item.pieces.length > 0 && (
                <div className="card-styles-editorial">
                  <span className="styles-label">Styles:</span>
                  <span className="styles-names">
                    {item.pieces.map((p) => p.title).join(" · ")}
                  </span>
                </div>
              )}

              <div className="card-bottom">
                <Link href={`/product/${item.slug}`} className="card-explore-link">
                  <span>Explore piece</span>
                  <span className="arrow">&rarr;</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Other Collections */}
      <section className="aesthetic-other-collections" aria-label="Other collections">
        <div className="other-collections-header">
          <h2>Other collections</h2>
          <Link href="/product" className="text-link">
            All objects &rarr;
          </Link>
        </div>

        <div className="aesthetic-other-grid">
          {otherCategories.map((c) => (
            <Link key={c.slug} href={`/product/c/${c.slug}`} className="aesthetic-other-card">
              <img src={c.image} alt="" width={120} height={120} />
              <div>
                <span className="card-eyebrow">{c.title}</span>
                <h3>{c.title}</h3>
                <p>{c.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
