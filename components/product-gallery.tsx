"use client";

import { useState } from "react";
import { Lightbox, type LightboxImage } from "@/components/lightbox";

export function ProductGallery({
  items,
}: {
  items: { slug: string; title: string; category: string; summary: string; image: string }[];
}) {
  const images: LightboxImage[] = items.map((item) => ({
    src: item.image,
    alt: item.title,
    title: item.title,
  }));
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);

  return (
    <>
      <div className="variations-gallery-grid">
        {items.map((item, index) => (
          <button
            type="button"
            className="variation-gallery-card"
            key={item.slug}
            onClick={() => {
              setStart(index);
              setOpen(true);
            }}
            aria-label={`Inspect ${item.title} in full resolution lightbox`}
          >
            <div className="variation-gallery-image-wrap">
              <img src={item.image} alt={item.title} width={800} height={800} loading="lazy" />
              <span className="gallery-zoom-hint" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <span>Inspect</span>
              </span>
            </div>
            <div className="variation-gallery-card-body">
              <div className="variation-card-title-row">
                <h3>{item.title}</h3>
                <span className="variation-card-index">0{index + 1}</span>
              </div>
              <p>{item.summary}</p>
            </div>
          </button>
        ))}
      </div>
      <Lightbox images={images} start={start} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
