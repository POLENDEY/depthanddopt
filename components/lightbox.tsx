"use client";

import { useEffect, useRef, useState } from "react";

export type LightboxImage = { src: string; alt: string };

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
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const frame = scroller.clientWidth || 1;
    scroller.scrollTo({ left: next * frame, behavior: "smooth" });
    setIndex(next);
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      closedby="any"
      aria-label="Product images"
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
      <div className="lightbox-scroller" ref={scrollerRef} onScroll={onScroll}>
        {images.map((image) => (
          <img key={image.src} src={image.src} alt={image.alt} width={800} height={800} />
        ))}
      </div>
      <div className="dots" role="tablist" aria-label="Images">
        {images.map((image, dot) => (
          <button
            key={image.src}
            type="button"
            className={dot === index ? "dot on" : "dot"}
            aria-label={`Show image ${dot + 1}`}
            aria-current={dot === index ? "true" : undefined}
            onClick={() => go(dot)}
          />
        ))}
      </div>
    </dialog>
  );
}
