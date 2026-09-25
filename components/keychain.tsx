"use client";

import { useEffect, useRef } from "react";

export function Keychain() {
  const tagRef = useRef<HTMLDivElement>(null);
  const rotation = useRef({ x: 8, y: 0 });
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const turned = useRef(false);

  function paint() {
    const tag = tagRef.current;
    if (!tag) return;
    tag.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`;
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) turned.current = true;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      if (!drag.current && !turned.current) {
        rotation.current.y += delta * 0.012;
        paint();
      }
      frame = window.requestAnimationFrame(tick);
    };
    paint();
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    turned.current = true;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      rx: rotation.current.x,
      ry: rotation.current.y,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    rotation.current = {
      x: drag.current.rx - (event.clientY - drag.current.y) * 0.5,
      y: drag.current.ry + (event.clientX - drag.current.x) * 0.5,
    };
    paint();
  }

  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div className="stage">
      <div
        ref={tagRef}
        className="tag"
        role="img"
        aria-label="Keychain. Hold and drag to rotate."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <i className="ring" />
        <span>D&amp;D</span>
      </div>
    </div>
  );
}
