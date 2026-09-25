"use client";

import { useEffect, useRef, useState } from "react";

const samples = [
  { title: "Keychain", image: "/images/keychain.svg" },
  { title: "Charm", image: "/images/charm.svg" },
  { title: "Plate", image: "/images/plate.svg" },
  { title: "Favor", image: "/images/favor.svg" },
  { title: "Card", image: "/images/card.svg" },
  { title: "Sign", image: "/images/sign.svg" },
];

const slides = [{ title: "Spotify Panaginip", model: "/models/Spotify-Panaginip.glb" }, ...samples];
const loop = [...slides, slides[0]];

export function ObjectReel() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const holding = useRef(false);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const rotation = useRef({ x: 0.2, y: 0.4 });
  const modelRef = useRef<HTMLDivElement>(null);

  function paint() {
    const model = modelRef.current;
    if (!model) return;
    model.style.transform = `rotateX(${rotation.current.x}rad) rotateY(${rotation.current.y}rad)`;
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (holding.current) return;
      setAnimate(true);
      setIndex((current) => current + 1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (animate || index !== 0) return;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate, index]);

  useEffect(() => {
    rotation.current = { x: 0.2, y: 0.4 };
    paint();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      if (!drag.current) {
        rotation.current.y += delta * 0.00055;
        paint();
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [index]);

  function onTransitionEnd() {
    if (index !== slides.length) return;
    setAnimate(false);
    setIndex(0);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    holding.current = true;
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
    paint();
  }

  function onPointerUp() {
    drag.current = null;
    holding.current = false;
  }

  const shown = index % slides.length;

  return (
    <div className="reel">
      <div className="reel-window">
        <div
          className={animate ? "reel-track" : "reel-track still"}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={onTransitionEnd}
        >
          {loop.map((slide, slideIndex) => (
            <div className="reel-slide" key={`${slide.title}-${slideIndex}`} aria-hidden={slideIndex !== index}>
              <div
                className="reel-stage"
                onPointerDown={slideIndex === index ? onPointerDown : undefined}
                onPointerMove={slideIndex === index ? onPointerMove : undefined}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {"model" in slide ? (
                  <GlbModel src={slide.model} rotation={rotation} />
                ) : (
                  <div className="reel-model" ref={slideIndex === index ? modelRef : undefined}>
                    <img src={slide.image} alt="" width={240} height={240} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p>{slides[shown].title}</p>
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
  const [status, setStatus] = useState("Loading model");

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

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0xffffff, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      scene.add(new THREE.AmbientLight(0xffffff, 1.2));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(2, 3, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.45);
      fill.position.set(-2, 1, -2);
      scene.add(fill);

      const group = new THREE.Group();
      scene.add(group);

      const frameCamera = (halfX: number, halfY: number) => {
        const { width, height } = host.getBoundingClientRect();
        if (width < 1 || height < 1) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const dist = Math.max(halfY / Math.tan(vFov / 2), halfX / Math.tan(hFov / 2)) * 1.2;
        camera.position.set(0, 0, dist);
        camera.near = Math.max(dist / 100, 0.01);
        camera.far = dist * 20;
        camera.updateProjectionMatrix();
      };

      let fitted = false;
      let half = { x: 0.5, y: 0.5 };
      const resize = () => frameCamera(half.x, half.y);
      const observer = new ResizeObserver(resize);
      observer.observe(host);

      new GLTFLoader().load(
        src,
        (gltf) => {
          if (disposed) return;
          const root = gltf.scene;
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const fittedGroup = new THREE.Group();
          root.position.sub(center);
          fittedGroup.add(root);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          fittedGroup.scale.setScalar(1 / maxDim);
          group.add(fittedGroup);
          half = { x: size.x / maxDim / 2, y: size.y / maxDim / 2 };
          fitted = true;
          frameCamera(half.x, half.y);
          setStatus("");
        },
        undefined,
        () => {
          if (!disposed) setStatus("Could not load the model");
        },
      );

      const tick = () => {
        group.rotation.x = rotation.current.x;
        group.rotation.y = rotation.current.y;
        if (fitted) renderer.render(scene, camera);
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);

      cleanup = () => {
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
  }, [src, rotation]);

  return (
    <div className="reel-glb" ref={hostRef}>
      {status ? <p className="reel-status">{status}</p> : null}
    </div>
  );
}
