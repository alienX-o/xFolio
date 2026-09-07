"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { useReducedMotion } from "@/lib/hooks";

/**
 * Pointer-following 3D tilt for cards.
 *
 * Writes transforms straight to the node inside a single animation frame
 * rather than storing pointer position in state — a card that re-rendered on
 * every mousemove would take its whole subtree with it. Listeners are attached
 * to the card, not the window, so only the card under the cursor does work.
 */
export function Tilt({
  children,
  className,
  strength = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  strength?: number;
  glare?: boolean;
}) {
  const { effects } = useConfig();
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);

  const enabled = effects.tilt && !reduced;

  useEffect(() => {
    const el = host.current;
    if (!el || !enabled) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let hovering = false;

    const render = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      el.style.transform = `perspective(900px) rotateX(${currentY.toFixed(
        3,
      )}deg) rotateY(${currentX.toFixed(3)}deg) translateZ(0)`;

      if (glare) {
        // Move the highlight opposite the tilt so it reads as a light source.
        el.style.setProperty("--glare-x", `${50 - currentX * 3}%`);
        el.style.setProperty("--glare-y", `${50 + currentY * 3}%`);
      }

      const settled =
        Math.abs(targetX - currentX) < 0.01 &&
        Math.abs(targetY - currentY) < 0.01;

      if (settled && !hovering) {
        frame = 0;
        el.style.transform = "";
        el.style.removeProperty("--glare-x");
        el.style.removeProperty("--glare-y");
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (frame === 0) frame = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      targetX = (px - 0.5) * 2 * strength;
      targetY = -(py - 0.5) * 2 * strength;
      hovering = true;
      start();
    };

    const onLeave = () => {
      hovering = false;
      targetX = 0;
      targetY = 0;
      start();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, strength, glare]);

  return (
    <div
      ref={host}
      className={className}
      style={
        enabled
          ? { transformStyle: "preserve-3d", willChange: "transform" }
          : undefined
      }
    >
      {children}
    </div>
  );
}
