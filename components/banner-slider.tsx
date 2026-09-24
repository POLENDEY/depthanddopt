"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    kicker: "3D print",
    title: "Keychains with a name",
    text: "A small tag, a ring, and the letters you want to carry.",
    image: "/images/keychain.svg",
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

const loop = [...slides, slides[0]];

export function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const active = index % slides.length;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (animate || index !== 0) return;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate, index]);

  function onTransitionEnd() {
    if (index !== slides.length) return;
    setAnimate(false);
    setIndex(0);
  }

  return (
    <section className="wrap banner" aria-roledescription="carousel" aria-label="Studio highlights">
      <div className="banner-window">
        <div
          className={animate ? "banner-track" : "banner-track still"}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {loop.map((slide, slideIndex) => (
            <article className="banner-slide" key={`${slide.href}-${slideIndex}`} aria-hidden={slideIndex !== index}>
              <img
                src={slide.image}
                alt=""
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
        <div className="dots" role="tablist" aria-label="Slides">
          {slides.map((item, dot) => (
            <button
              key={item.href}
              type="button"
              className={dot === active ? "dot on" : "dot"}
              aria-label={`Show slide ${dot + 1}`}
              aria-current={dot === active ? "true" : undefined}
              onClick={() => {
                setAnimate(true);
                setIndex(dot);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
