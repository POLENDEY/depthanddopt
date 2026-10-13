"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";

type CategoryItem = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly image: string;
};

export function ProductCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: readonly CategoryItem[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");
  const searchInputId = useId();

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      // Category filter match
      const categoryMatch =
        selectedCategory === "all" ||
        product.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === "3d-print" && product.category === "3D print");

      if (!categoryMatch) return false;

      // Search query match
      if (!query) return true;

      const titleMatch = product.title.toLowerCase().includes(query);
      const summaryMatch = product.summary.toLowerCase().includes(query);
      const descriptionMatch = product.description.toLowerCase().includes(query);
      const categoryTextMatch = product.category.toLowerCase().includes(query);
      const piecesMatch = product.pieces.some(
        (piece) =>
          piece.title.toLowerCase().includes(query) ||
          piece.summary.toLowerCase().includes(query) ||
          piece.slug.toLowerCase().includes(query)
      );

      return titleMatch || summaryMatch || descriptionMatch || categoryTextMatch || piecesMatch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Count by category
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    categories.forEach((cat) => {
      map[cat.slug] = products.filter(
        (p) =>
          p.category.toLowerCase() === cat.slug.toLowerCase() ||
          (cat.slug === "3d-print" && p.category === "3D print")
      ).length;
    });
    return map;
  }, [products, categories]);

  // Grouped products by category for grouped view
  const groupedProducts = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = filteredProducts.filter(
          (p) =>
            p.category.toLowerCase() === cat.slug.toLowerCase() ||
            (cat.slug === "3d-print" && p.category === "3D print")
        );
        return {
          category: cat,
          products: catProducts,
        };
      })
      .filter((group) => group.products.length > 0);
  }, [categories, filteredProducts]);

  function clearFilters() {
    setSelectedCategory("all");
    setSearchQuery("");
  }

  return (
    <div className="aesthetic-catalog-root">
      {/* Minimalist Navigation Bar */}
      <div className="aesthetic-filter-bar">
        {/* Category Tabs */}
        <div className="aesthetic-tabs" role="tablist" aria-label="Product categories">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "all"}
            className={`aesthetic-tab ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <span>All</span>
            <span className="tab-count">{counts["all"]}</span>
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`aesthetic-tab ${isActive ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                <span>{cat.title}</span>
                <span className="tab-count">{counts[cat.slug] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Layout Actions */}
        <div className="aesthetic-filter-actions">
          <div className="aesthetic-search">
            <svg
              className="search-glyph"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id={searchInputId}
              type="search"
              className="aesthetic-search-input"
              placeholder="Search objects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search catalog"
            />
            {searchQuery && (
              <button
                type="button"
                className="aesthetic-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="aesthetic-view-switch" aria-label="View mode">
            <button
              type="button"
              className={`switch-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              className={`switch-btn ${viewMode === "grouped" ? "active" : ""}`}
              onClick={() => setViewMode("grouped")}
              title="Grouped view"
              aria-label="Grouped view"
              aria-pressed={viewMode === "grouped"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter State Notice */}
      {(searchQuery || selectedCategory !== "all") && (
        <div className="aesthetic-active-filter">
          <span>
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "object" : "objects"}
            {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
          </span>
          <button type="button" className="aesthetic-reset-btn" onClick={clearFilters}>
            Clear
          </button>
        </div>
      )}

      {/* Directory Content */}
      {filteredProducts.length === 0 ? (
        <div className="aesthetic-empty">
          <p className="empty-title">No objects found</p>
          <p className="empty-sub">Try searching for keychains, charms, plates, or cards.</p>
          <button type="button" className="button secondary" onClick={clearFilters}>
            Reset filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="aesthetic-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="aesthetic-grouped-container">
          {groupedProducts.map(({ category, products: groupItems }) => (
            <section className="aesthetic-group" key={category.slug}>
              <div className="group-heading">
                <div>
                  <h2 className="group-title">{category.title}</h2>
                  <p className="group-desc">{category.summary}</p>
                </div>
                <Link href={`/product/c/${category.slug}`} className="group-link">
                  View collection &rarr;
                </Link>
              </div>

              <div className="aesthetic-grid">
                {groupItems.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="aesthetic-card">
      <Link href={`/product/${product.slug}`} className="card-image-wrap">
        <img
          src={product.image}
          alt={product.title}
          width={800}
          height={800}
          loading="lazy"
          className="card-image"
        />
        <span className="card-badge">{product.category}</span>
      </Link>

      <div className="card-meta">
        <div className="card-eyebrow">
          <span>{product.pieces.length} variations</span>
        </div>

        <h3 className="card-heading">
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>

        <p className="card-summary">{product.summary}</p>

        {/* Refined editorial variations preview */}
        {product.pieces && product.pieces.length > 0 && (
          <div className="card-styles-editorial">
            <span className="styles-label">Styles:</span>
            <span className="styles-names">
              {product.pieces.map((p) => p.title).join(" · ")}
            </span>
          </div>
        )}

        <div className="card-bottom">
          <Link href={`/product/${product.slug}`} className="card-explore-link">
            <span>Explore piece</span>
            <span className="arrow">&rarr;</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
