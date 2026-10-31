"use client";

import { useState } from "react";
import { Lightbox } from "@/components/lightbox";

type Photo = { id: string; url: string; width: number | null; height: number | null; alt?: string };

export function ProductPhotos({ title, photos }: { title: string; photos: Photo[] }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const images = photos.map((photo, index) => ({
    src: photo.url,
    alt: photo.alt || `${title}, photo ${index + 1} of ${photos.length}`,
    title: `${title} · ${index + 1}/${photos.length}`,
  }));

  return (
    <>
      <div className="product-photo-grid">
        {photos.map((photo, index) => (
          <button
            type="button"
            className="product-photo"
            key={photo.id}
            onClick={() => {
              setStart(index);
              setOpen(true);
            }}
            aria-label={`Open photo ${index + 1} of ${photos.length} in full size`}
          >
            <img
              src={photo.url}
              alt={images[index].alt}
              width={photo.width ?? 800}
              height={photo.height ?? 800}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : undefined}
            />
          </button>
        ))}
      </div>
      <Lightbox images={images} start={start} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
