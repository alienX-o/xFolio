"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { ensurePointerTracking, getPointer } from "./pointer";
import { Stage } from "./Stage";

/**
 * A rotating sphere of skill labels.
 *
 * Same canvas-texture idea as the hero text: each label is painted to a small
 * 2D canvas and used as a sprite, so there is no font file to load and the
 * labels inherit the configured body font. Sprites always face the camera, so
 * the tags stay readable at every point of the rotation without any billboard
 * maths of our own.
 */

const MAX_LABELS = 44;
const LABEL_FONT_SIZE = 96;

type Label = {
  text: string;
  texture: THREE.CanvasTexture;
  aspect: number;
  position: THREE.Vector3;
};

function paintLabel(text: string, stack: string): { canvas: HTMLCanvasElement; aspect: number } | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const font = `600 ${LABEL_FONT_SIZE}px ${stack}`;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width) + 32;
  const height = Math.ceil(LABEL_FONT_SIZE * 1.4);

  canvas.width = Math.max(2, width);
  canvas.height = height;

  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return { canvas, aspect: canvas.width / canvas.height };
}

function useLabels(texts: string[], radius: number): Label[] {
  const gl = useThree((s) => s.gl);

  return useMemo(() => {
    if (typeof document === "undefined") return [];

    const stack =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--x-font-body")
        .trim() || "system-ui, sans-serif";

    const picked = texts.slice(0, MAX_LABELS);
    const total = picked.length;

    return picked.flatMap((text, i) => {
      const painted = paintLabel(text, stack);
      if (!painted) return [];

      const texture = new THREE.CanvasTexture(painted.canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());

      // Fibonacci sphere: even coverage without clustering at the poles,
      // which a naive random or lat/long distribution both suffer from.
      const offset = 2 / total;
      const increment = Math.PI * (3 - Math.sqrt(5));
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * increment;

      return [
        {
          text,
          texture,
          aspect: painted.aspect,
          position: new THREE.Vector3(
            Math.cos(phi) * r * radius,
            y * radius,
            Math.sin(phi) * r * radius,
          ),
        },
      ];
    });
  }, [texts, radius, gl]);
}

function Cloud({
  labels: texts,
  intensity,
  colors,
}: {
  labels: string[];
  intensity: number;
  colors: { primary: number; secondary: number; accent: number };
}) {
  const group = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);
  const radius = Math.min(2.6, Math.max(1.6, viewport.width * 0.16));
  const labels = useLabels(texts, radius);

  useEffect(() => ensurePointerTracking(), []);

  useEffect(
    () => () => {
      for (const label of labels) label.texture.dispose();
    },
    [labels],
  );

  const palette = useMemo(
    () => [
      new THREE.Color(colors.primary),
      new THREE.Color(colors.secondary),
      new THREE.Color(colors.accent),
    ],
    [colors.primary, colors.secondary, colors.accent],
  );

  const spin = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    const p = getPointer();
    // The pointer steers the rotation *rate*, so the cloud keeps turning on
    // its own and speeds up or reverses as the cursor moves across it.
    const targetY = 0.18 + p.x * 0.5 * (0.4 + intensity);
    const targetX = -p.y * 0.35 * (0.4 + intensity);
    const t = 1 - Math.pow(0.02, delta);
    spin.current.y += (targetY - spin.current.y) * t;
    spin.current.x += (targetX - spin.current.x) * t;

    g.rotation.y += delta * spin.current.y;
    g.rotation.x += delta * spin.current.x;

    // Fade labels on the far side so the front stays readable.
    for (const child of g.children) {
      const world = child.getWorldPosition(new THREE.Vector3());
      const depth = (world.z + radius) / (radius * 2);
      const material = (child as THREE.Sprite).material;
      material.opacity = 0.25 + depth * 0.75;
    }
  });

  return (
    <group ref={group}>
      {labels.map((label, i) => (
        <sprite
          key={`${label.text}-${i}`}
          position={label.position}
          scale={[0.34 * label.aspect, 0.34, 1]}
        >
          <spriteMaterial
            map={label.texture}
            color={palette[i % palette.length]}
            transparent
            depthWrite={false}
            opacity={0.9}
          />
        </sprite>
      ))}
    </group>
  );
}

export default function SkillCloudCanvas({
  labels,
  intensity,
  colors,
  className,
}: {
  labels: string[];
  intensity: number;
  colors: { primary: number; secondary: number; accent: number };
  className?: string;
}) {
  return (
    <Stage className={className} camera={{ position: [0, 0, 6.4], fov: 45 }}>
      <Cloud labels={labels} intensity={intensity} colors={colors} />
    </Stage>
  );
}
