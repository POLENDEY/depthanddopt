"use client";

import { useEffect, useRef } from "react";

export function Keychain() {
  const stageRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const rotation = useRef({ x: 8, y: 0 });
  const scale = useRef(1);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const turned = useRef(false);

  function paint() {
    const tag = tagRef.current;
    if (!tag) return;
    tag.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg) scale(${scale.current})`;
  }

  function pinchDistance() {
    const points = [...pointers.current.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function setScale(next: number) {
    scale.current = Math.min(2.4, Math.max(0.7, next));
    paint();
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
    const stage = stageRef.current;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setScale(scale.current + (event.deltaY > 0 ? -0.08 : 0.08));
    };
    stage?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.cancelAnimationFrame(frame);
      stage?.removeEventListener("wheel", onWheel);
    };
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    turned.current = true;
    if (pointers.current.size >= 2) {
      drag.current = null;
      pinch.current = { distance: pinchDistance(), scale: scale.current };
      return;
    }
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      rx: rotation.current.x,
      ry: rotation.current.y,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const distance = pinchDistance();
      if (pinch.current.distance > 0) setScale(pinch.current.scale * (distance / pinch.current.distance));
      return;
    }
    if (!drag.current) return;
    rotation.current = {
      x: drag.current.rx - (event.clientY - drag.current.y) * 0.5,
      y: drag.current.ry + (event.clientX - drag.current.x) * 0.5,
    };
    paint();
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  return (
    <div className="stage" ref={stageRef}>
      <div
        ref={tagRef}
        className="tag"
        role="img"
        aria-label="Keychain. Hold and drag to rotate. Back shows depthanddot@gmail.com and +63 938 852 8698."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {Array.from({ length: 2 }, (_, index) => (
          <span className="tag-slab" key={index} style={{ transform: `translateZ(${-index}px)` }} />
        ))}
        <div className="tag-face">
          <i className="ring" />
          <span>D&amp;D</span>
        </div>
        <div className="tag-back">
          <i className="ring" />
          <p>depthanddot@gmail.com</p>
          <p>+63 938 852 8698</p>
        </div>
      </div>
    </div>
  );
}
