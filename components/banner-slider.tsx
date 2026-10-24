"use client";

import { useEffect, useState } from "react";

type Slide = {
  kicker: string;
  title: string;
  text: string;
  image: string;
  srcSet?: string;
  position?: string;
  alt?: string;
  href: string;
};

const slides: Slide[] = [
  {
    kicker: "3D print",
    title: "Keychains with a name",
    text: "A small tag, a ring, and the letters you want to carry.",
    image: "/images/banner-keychains.webp",
    srcSet: "/images/banner-keychains-1200.webp 1200w, /images/banner-keychains.webp 2240w",
    position: "80% 50%",
    alt: "Two custom 3D printed Spotify code keychains with the names PAUL and TRIXIA",
    href: "/product/c/3d-print",
  },
  {
    kicker: "Personal",
    title: "Objects made for one person",
    text: "Charms and plates set around a name or a short line.",
    image: "/images/plate.svg",
    href: "/product/c/personal",
  },
  {
    kicker: "Print",
    title: "Cards, stickers, small signs",
    text: "Paper pieces that belong with the object.",
    image: "/images/card.svg",
    href: "/product/c/print",
  },
];

export function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="wrap banner" aria-roledescription="carousel" aria-label="Studio highlights">
      <div className="banner-window">
        {slides.map((slide, slideIndex) => (
          <article
            className={slideIndex === index ? "banner-slide on" : "banner-slide"}
            key={slide.href}
            aria-hidden={slideIndex !== index}
          >
            <img
              src={slide.image}
              srcSet={slide.srcSet}
              sizes={slide.srcSet ? "(max-width: 1160px) 100vw, 1120px" : undefined}
              style={slide.position ? { objectPosition: slide.position } : undefined}
              alt={slide.alt ?? ""}
              width={1600}
              height={700}
              fetchPriority={slideIndex === 0 ? "high" : undefined}
              loading={slideIndex === 0 ? "eager" : "lazy"}
            />
            <div className="banner-copy">
              <p className="banner-dark">{slide.kicker}</p>
              <h2 className="banner-light">{slide.title}</h2>
              <p className="banner-light faded">{slide.text}</p>
              <a className="banner-light" href={slide.href} tabIndex={slideIndex === index ? 0 : -1}>
                View this group
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="banner-controls">
        <button
          type="button"
          className="button secondary"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Play" : "Pause"}
        </button>
        <div className="dots" role="tablist" aria-label="Highlights">
          {slides.map((item, dot) => (
            <button
              key={item.href}
              type="button"
              className={dot === index ? "dot on" : "dot"}
              aria-label={`Show slide ${dot + 1}`}
              aria-current={dot === index ? "true" : undefined}
              onClick={() => setIndex(dot)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
