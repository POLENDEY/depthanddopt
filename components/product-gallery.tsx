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
      <div className="grid store">
        {items.map((item, index) => (
          <button
            type="button"
            className="card store-card"
            key={item.slug}
            onClick={() => {
              setStart(index);
              setOpen(true);
            }}
          >
            <img src={item.image} alt="" width={800} height={800} loading="lazy" />
            <div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
          </button>
        ))}
      </div>
      <Lightbox images={images} start={start} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
