"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The one place a WebGL canvas gets created.
 *
 * Every scene mounts through here so the guards live in a single file:
 *
 *  - device pixel ratio is clamped, since a retina display would otherwise
 *    render four times the pixels for a decorative background;
 *  - the render loop stops when the canvas scrolls out of view or the tab is
 *    hidden, so an idle page costs no GPU time;
 *  - antialiasing is off and the depth buffer is unused, which these scenes
 *    do not need and which keeps weak GPUs comfortable.
 *
 * Whether a scene should exist at all — config switch, WebGL support, reduced
 * motion — is decided by the caller before this component is imported, so the
 * three.js chunk is never even downloaded when it is not wanted.
 */
export function Stage({
  children,
  className,
  camera,
  dpr = [1, 1.75],
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  camera?: CanvasProps["camera"];
  dpr?: CanvasProps["dpr"];
  /** Let pointer events through to the canvas (needed for raycasting). */
  interactive?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [tabActive, setTabActive] = useState(true);

  useEffect(() => {
    const el = holder.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setVisible(entry.isIntersecting);
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () =>
      setTabActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const running = visible && tabActive;

  return (
    <div
      ref={holder}
      className={className}
      // Decorative: the canvas conveys nothing a screen reader needs, and it
      // must not swallow clicks meant for the content sitting on top of it.
      aria-hidden="true"
      style={interactive ? undefined : { pointerEvents: "none" }}
    >
      <Canvas
        frameloop={running ? "always" : "never"}
        dpr={dpr}
        camera={camera ?? { position: [0, 0, 6], fov: 45 }}
        gl={{
          antialias: false,
          alpha: true,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
        style={{ pointerEvents: interactive ? "auto" : "none" }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
