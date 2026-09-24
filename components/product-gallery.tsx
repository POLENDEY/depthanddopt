"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbox, type LightboxImage } from "@/components/lightbox";

export function ProductGallery({
  items,
}: {
  items: { slug: string; title: string; category: string; summary: string; image: string }[];
}) {
  const images: LightboxImage[] = items.map((item) => ({
    src: item.image,
    alt: `${item.title} by Depth & Dot`,
  }));
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);

  return (
    <>
      <div className="grid">
        {items.map((item, index) => (
          <article className="card" key={item.slug}>
            <button
              type="button"
              className="image-button"
              onClick={() => {
                setStart(index);
                setOpen(true);
              }}
            >
              <img src={item.image} alt={item.title} width={800} height={800} loading="lazy" />
            </button>
            <div>
              <span className="kicker">{item.category}</span>
              <h3>
                <Link href={`/product/${item.slug}`}>{item.title}</Link>
              </h3>
              <p>{item.summary}</p>
            </div>
          </article>
        ))}
      </div>
      <Lightbox images={images} start={start} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
