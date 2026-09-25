"use client";

import { useEffect, useRef, useState } from "react";

export type LightboxImage = { src: string; alt: string; title: string };

export function Lightbox({
  images,
  start = 0,
  open,
  onClose,
}: {
  images: LightboxImage[];
  start?: number;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setIndex(start);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const frame = scroller.clientWidth || 1;
    scroller.scrollTo({ left: start * frame });
  }, [open, start]);

  function onScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const frame = scroller.clientWidth || 1;
    setIndex(Math.round(scroller.scrollLeft / frame));
  }

  function go(next: number) {
    const count = images.length;
    if (count === 0) return;
    const target = (next + count) % count;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const frame = scroller.clientWidth || 1;
    scroller.scrollTo({ left: target * frame, behavior: "smooth" });
    setIndex(target);
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      closedby="any"
      aria-label="Product"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="lightbox-bar">
        <button type="button" className="button secondary" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="lightbox-stage">
        <button type="button" className="lightbox-nav prev" onClick={() => go(index - 1)} aria-label="Previous">
          Previous
        </button>
        <div className="lightbox-scroller" ref={scrollerRef} onScroll={onScroll}>
          {images.map((image) => (
            <figure className="lightbox-slide" key={image.title}>
              <img src={image.src} alt={image.alt} width={800} height={800} />
              <figcaption>
                <h2>{image.title}</h2>
              </figcaption>
            </figure>
          ))}
        </div>
        <button type="button" className="lightbox-nav next" onClick={() => go(index + 1)} aria-label="Next">
          Next
        </button>
      </div>
      <div className="dots" role="tablist" aria-label="Images">
        {images.map((image, dot) => (
          <button
            key={image.title}
            type="button"
            className={dot === index ? "dot on" : "dot"}
            aria-label={`Show ${image.title}`}
            aria-current={dot === index ? "true" : undefined}
            onClick={() => go(dot)}
          />
        ))}
      </div>
    </dialog>
  );
}
