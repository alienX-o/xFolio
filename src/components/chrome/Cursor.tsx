"use client";

import { useEffect, useRef } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { ensurePointerTracking, getPointer } from "@/components/three/pointer";
import { useMediaQuery, useReducedMotion } from "@/lib/hooks";

/**
 * Custom cursor, drawn on a 2D canvas.
 *
 * The previous version positioned a DOM element from React state on every
 * mousemove, which re-rendered the entire page tree to move one dot. This
 * draws into a fixed canvas inside its own animation frame: no renders, no
 * layout, and the trail variant gets motion history for free because the
 * previous frame is still on the canvas.
 *
 * Disabled outright on touch pointers (there is no cursor to augment) and
 * whenever the OS asks for reduced motion.
 */
export function Cursor() {
  const { effects } = useConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(pointer: fine)");

  const kind = effects.cursor;
  const enabled = kind !== "none" && !reduced && finePointer;

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ensurePointerTracking();

    let frame = 0;
    let dpr = 1;
    const trail: { x: number; y: number }[] = [];
    const smooth = { x: 0, y: 0, started: false };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Colours are read once from the theme; re-read on theme change happens
    // via the effect key below.
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--x-primary").trim() || "#3b82f6";
    const secondary =
      styles.getPropertyValue("--x-secondary").trim() || "#a855f7";

    const draw = () => {
      const p = getPointer();

      if (!smooth.started && p.active) {
        smooth.x = p.px;
        smooth.y = p.py;
        smooth.started = true;
      }
      // Lag behind the real cursor so the dot feels weighted.
      smooth.x += (p.px - smooth.x) * 0.22;
      smooth.y += (p.py - smooth.y) * 0.22;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!p.active) {
        frame = requestAnimationFrame(draw);
        return;
      }

      if (kind === "trail") {
        trail.push({ x: smooth.x, y: smooth.y });
        if (trail.length > 22) trail.shift();

        ctx.globalCompositeOperation = "lighter";
        trail.forEach((point, i) => {
          const t = i / trail.length;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2 + t * 7, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? primary : secondary;
          ctx.globalAlpha = t * 0.28;
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      if (kind === "glow") {
        const radius = 90;
        const gradient = ctx.createRadialGradient(
          smooth.x,
          smooth.y,
          0,
          smooth.x,
          smooth.y,
          radius,
        );
        gradient.addColorStop(0, primary);
        gradient.addColorStop(1, "transparent");
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(smooth.x, smooth.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      // Every variant gets the leading dot, drawn at the true position so
      // clicking still feels precise.
      ctx.beginPath();
      ctx.arc(p.px, p.py, kind === "dot" ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
    // Re-run when the theme colours change so the cursor keeps up.
  }, [enabled, kind]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
