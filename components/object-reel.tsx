"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

export type Slide3D = {
  id: string;
  title: string;
  shortName: string;
  tag: string;
  summary: string;
  model: string;
  productSlug: string;
};

const slides: Slide3D[] = [
  {
    id: "isabella",
    title: "Articulated Name",
    shortName: "Articulated Name",
    tag: "Articulated Name",
    summary: "Flexible print-in-place letter joints designed to bend and move smoothly.",
    model: "/models/isabella-articulated-name.glb",
    productSlug: "isabella-articulated-name",
  },
  {
    id: "amelia",
    title: "Customize Magnet Name",
    shortName: "Customize Magnet Name",
    tag: "Customize Magnet Name",
    summary: "Solid dual-tone magnetic piece with raised typography for memo boards and desks.",
    model: "/models/amelia-magnet.glb",
    productSlug: "amelia-customize-magnet-name",
  },
  {
    id: "nicole",
    title: "Customize Keychain name",
    shortName: "Customize Keychain name",
    tag: "Customize Keychain name",
    summary: "Pocket-sized personal monogram tag with an integrated steel ring eyelet.",
    model: "/models/nicole-keychain.glb",
    productSlug: "customize-keychain-name",
  },
  {
    id: "spotify",
    title: "Spotify Bar code",
    shortName: "Spotify Bar code",
    tag: "Spotify Bar code",
    summary: "Dimensional scannable sound barcode readable directly with the Spotify app.",
    model: "/models/spotify-code-spotify-code.glb",
    productSlug: "spotify-code",
  },
];

export function ObjectReel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const holding = useRef(false);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const rotation = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Reduced motion preference
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPaused(true);
    }
  }, []);

  // Auto-slide advance timer
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (holding.current) return;
      setIndex((current) => (current + 1) % slides.length);
      rotation.current = { x: 0, y: 0 };
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  // Gentle auto-rotation tick
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      if (!drag.current && !pausedRef.current) {
        rotation.current.y += delta * 0.0005;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    holding.current = true;
    setHasInteracted(true);
    event.currentTarget.setPointerCapture(event.pointerId);
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
      x: Math.max(-1.1, Math.min(1.1, drag.current.rx + (event.clientY - drag.current.y) * 0.008)),
      y: drag.current.ry + (event.clientX - drag.current.x) * 0.008,
    };
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (holding.current) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // pointer capture released
      }
    }
    drag.current = null;
    holding.current = false;
  }

  function resetView() {
    rotation.current = { x: 0, y: 0 };
  }

  function prevSlide() {
    setIndex((curr) => (curr - 1 + slides.length) % slides.length);
    rotation.current = { x: 0, y: 0 };
  }

  function nextSlide() {
    setIndex((curr) => (curr + 1) % slides.length);
    rotation.current = { x: 0, y: 0 };
  }

  function selectSlide(i: number) {
    setIndex(i);
    rotation.current = { x: 0, y: 0 };
  }

  const current = slides[index];

  return (
    <div className="aesthetic-pedestal" aria-label="Interactive 3D model exhibition">
      <div
        className="pedestal-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <GlbModel src={current.model} rotation={rotation} />

        {!hasInteracted && (
          <div className="pedestal-hint" aria-hidden="true">
            <span>Drag to turn</span>
          </div>
        )}
      </div>

      <div className="pedestal-caption">
        <div className="pedestal-caption-main">
          <button type="button" className="pedestal-step" onClick={prevSlide} aria-label="Previous model">
            <span aria-hidden="true">‹</span>
          </button>
          <p className="pedestal-name">{current.title}</p>
          <button type="button" className="pedestal-step" onClick={nextSlide} aria-label="Next model">
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <div className="pedestal-caption-meta">
          <div className="pedestal-dots" role="tablist" aria-label="Models">
            {slides.map((slide, dot) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                className={dot === index ? "pedestal-dot on" : "pedestal-dot"}
                aria-label={slide.title}
                aria-selected={dot === index}
                onClick={() => selectSlide(dot)}
              />
            ))}
          </div>
          <span className="pedestal-count">
            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="pedestal-quiet"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
          >
            {paused ? "Play" : "Pause"}
          </button>
          <button type="button" className="pedestal-quiet" onClick={resetView}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function GlbModel({
  src,
  rotation,
}: {
  src: string;
  rotation: React.RefObject<{ x: number; y: number }>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading...");
  const loadModelRef = useRef<((url: string) => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0); // transparent background
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);

      const ambient = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(3, 4, 5);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xffffff, 0.6);
      fill.position.set(-3, 1, -3);
      scene.add(fill);

      const bottomLight = new THREE.DirectionalLight(0xffffff, 0.35);
      bottomLight.position.set(0, -3, 2);
      scene.add(bottomLight);

      const group = new THREE.Group();
      scene.add(group);

      let fitted = false;
      let half = { x: 0.5, y: 0.5 };

      const frameCamera = (halfX: number, halfY: number) => {
        const { width, height } = host.getBoundingClientRect();
        if (width < 1 || height < 1) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const dist = Math.max(halfY / Math.tan(vFov / 2), halfX / Math.tan(hFov / 2)) * 1.35;
        camera.position.set(0, 0, dist);
        camera.near = Math.max(dist / 100, 0.01);
        camera.far = dist * 20;
        camera.updateProjectionMatrix();
      };

      const resize = () => frameCamera(half.x, half.y);
      const observer = new ResizeObserver(resize);
      observer.observe(host);

      // Model caching dictionary
      const cache: Record<string, { group: THREE.Group; half: { x: number; y: number } }> = {};
      const loader = new GLTFLoader();

      const loadModel = (url: string) => {
        setStatus("Loading...");
        fitted = false;

        // Clear existing children in group
        while (group.children.length > 0) {
          group.remove(group.children[0]);
        }

        if (cache[url]) {
          const cached = cache[url];
          group.add(cached.group);
          half = cached.half;
          fitted = true;
          frameCamera(half.x, half.y);
          setStatus("");
          return;
        }

        loader.load(
          url,
          (gltf) => {
            if (disposed) return;
            const root = gltf.scene;
            const fittedGroup = new THREE.Group();
            fittedGroup.rotation.x = Math.PI / 2;
            fittedGroup.add(root);
            fittedGroup.updateMatrixWorld(true);

            const box = new THREE.Box3().setFromObject(fittedGroup);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            fittedGroup.position.sub(center);

            const modelHalf = { x: size.x / 2, y: size.y / 2 };
            cache[url] = { group: fittedGroup, half: modelHalf };

            group.add(fittedGroup);
            half = modelHalf;
            fitted = true;
            frameCamera(half.x, half.y);
            setStatus("");
          },
          undefined,
          () => {
            if (!disposed) {
              setStatus("Could not load 3D model");
            }
          },
        );
      };

      loadModelRef.current = loadModel;
      loadModel(src);

      // Animation loop
      const tick = () => {
        group.rotation.x = rotation.current.x;
        group.rotation.y = rotation.current.y;
        if (fitted) {
          renderer.render(scene, camera);
        }
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);

      cleanup = () => {
        loadModelRef.current = null;
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
        scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        });
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only mount once!

  // When src changes, swap model seamlessly
  useEffect(() => {
    if (loadModelRef.current) {
      loadModelRef.current(src);
    }
  }, [src]);

  return (
    <div className="pedestal-canvas-wrap" ref={hostRef}>
      {status ? (
        <div className="pedestal-status">
          <span className="pedestal-spinner" aria-hidden="true" />
          <p>{status}</p>
        </div>
      ) : null}
    </div>
  );
}
