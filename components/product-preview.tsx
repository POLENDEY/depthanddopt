"use client";

import { useEffect, useRef, useState } from "react";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPhotos } from "@/components/product-photos";

export type PreviewPiece = { slug: string; title: string; summary: string; image: string };
export type PreviewPhoto = { id: string; url: string; width: number | null; height: number | null; alt: string };

export function ProductPreview({
  open,
  onClose,
  title,
  summary,
  description,
  details,
  category,
  artwork,
  pieces,
  photos,
  note,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  description: string;
  details: string[];
  category: string;
  artwork: string;
  pieces: PreviewPiece[];
  photos: PreviewPhoto[];
  note: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"page" | "card">("page");
  const highlights = details.map((detail) => detail.trim()).filter(Boolean);
  const cover = photos[0]?.url ?? artwork;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="lightbox page-preview-dialog" ref={dialogRef} onClose={onClose} aria-label="Preview before publishing">
      {open ? (
        <div>
          <div className="page-preview-bar">
            <div className="studio-tabs" role="tablist" aria-label="Preview">
              <button type="button" role="tab" aria-selected={view === "page"} onClick={() => setView("page")}>Product page</button>
              <button type="button" role="tab" aria-selected={view === "card"} onClick={() => setView("card")}>Catalog card</button>
            </div>
            <span className="storage-badge is-warn">{note}</span>
            <button className="button secondary" type="button" onClick={onClose}>Close</button>
          </div>

          <div className="page-preview-frame">
            {view === "page" ? (
              <article className="wrap page aesthetic-product-detail-page">
                <header className="aesthetic-detail-header">
                  <div className="detail-header-copy">
                    <p className="aesthetic-eyebrow">
                      <span>{category}</span>
                      <span>&bull;</span>
                      <span>{pieces.length} variations</span>
                    </p>
                    <h1 className="aesthetic-detail-title">{title}</h1>
                    <p className="aesthetic-detail-lead">{description}</p>
                  </div>
                  <div className="aesthetic-detail-actions">
                    <span className="button">Start an inquiry</span>
                    <span className="aesthetic-back-link">View {category} collection &rarr;</span>
                  </div>
                </header>

                {photos.length > 0 && (
                  <section className="aesthetic-variations-section" aria-label={`${title} photos`}>
                    <div className="aesthetic-section-head">
                      <h2 className="aesthetic-section-title">Photos</h2>
                      <span className="aesthetic-section-count">
                        {photos.length} {photos.length === 1 ? "photo" : "photos"}
                      </span>
                    </div>
                    <ProductPhotos title={title} photos={photos} />
                  </section>
                )}

                <section className="aesthetic-variations-section" aria-label="Product variations gallery">
                  <div className="aesthetic-section-head">
                    <h2 className="aesthetic-section-title">Variations &amp; Pieces</h2>
                    <span className="aesthetic-section-count">{pieces.length} styles</span>
                  </div>
                  <ProductGallery items={pieces.map((piece) => ({ ...piece, category }))} />
                </section>

                <section className="aesthetic-specs-section" aria-label="Product specifications">
                  <div className="aesthetic-section-head">
                    <h2 className="aesthetic-section-title">Specifications &amp; Details</h2>
                  </div>
                  <div className="aesthetic-specs-list">
                    {highlights.map((detail, index) => (
                      <div className="aesthetic-spec-item" key={index}>
                        <span className="spec-item-num">0{index + 1}</span>
                        <p className="spec-item-text">{detail}</p>
                      </div>
                    ))}
                    <div className="aesthetic-spec-item custom-notice">
                      <span className="spec-item-num">&bull;</span>
                      <p className="spec-item-text">Custom lettering, sizing, or batch orders welcome via inquiry.</p>
                    </div>
                  </div>
                </section>
              </article>
            ) : (
              <div className="page-preview-cards">
                <article className="aesthetic-card">
                  <div className="card-image-wrap">
                    <img src={cover} alt={photos[0]?.alt || title} width={800} height={800} className="card-image" />
                    <span className="card-badge">{category}</span>
                  </div>
                  <div className="card-meta">
                    <div className="card-eyebrow">
                      <span>{pieces.length} variations</span>
                    </div>
                    <h3 className="card-heading">{title}</h3>
                    <p className="card-summary">{summary}</p>
                    {pieces.length > 0 && (
                      <div className="card-styles-editorial">
                        <span className="styles-label">Styles:</span>
                        <span className="styles-names">{pieces.map((piece) => piece.title).join(" · ")}</span>
                      </div>
                    )}
                    <div className="card-bottom">
                      <span className="card-explore-link">
                        <span>Explore piece</span>
                        <span className="arrow">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </article>
                <p className="note">This is how the product appears in the catalog, category pages, and &ldquo;More in&rdquo; lists. The first photo is the cover.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
