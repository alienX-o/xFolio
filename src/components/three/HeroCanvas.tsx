"use client";

import type { HeroScene } from "@/config/schema";
import { Blob, Dots, Grid, Particles, Rings, Tunnel, Waves } from "./scenes";
import { ShaderText, type TextBox } from "./ShaderText";
import { Stage } from "./Stage";

/**
 * The hero's WebGL layer: a background scene chosen by config, and optionally
 * the shader-distorted title drawn over the real heading's footprint.
 *
 * Both share one Canvas. A second WebGL context would double the driver
 * overhead for a decorative background, and sharing the camera means the title
 * and the scene behind it agree about perspective and parallax.
 */

const SCENES = {
  dots: Dots,
  grid: Grid,
  particles: Particles,
  blob: Blob,
  waves: Waves,
  rings: Rings,
  tunnel: Tunnel,
} as const;

export default function HeroCanvas({
  scene,
  intensity,
  colors,
  title,
  showTitle,
  titleBox,
  className,
}: {
  scene: HeroScene;
  intensity: number;
  colors: { primary: number; secondary: number; accent: number };
  title: string;
  showTitle: boolean;
  titleBox?: TextBox | null;
  className?: string;
}) {
  const Scene = scene === "none" ? null : SCENES[scene];

  if (!Scene && !showTitle) return null;

  return (
    <Stage className={className} camera={{ position: [0, 0, 6], fov: 45 }}>
      {/* Pushed back so the background never intersects the title plane. */}
      {Scene ? (
        <group position={[0, 0, -1.5]}>
          <Scene intensity={intensity} colors={colors} />
        </group>
      ) : null}

      {showTitle && title ? (
        <ShaderText
          text={title}
          intensity={intensity}
          colors={colors}
          box={titleBox}
        />
      ) : null}
    </Stage>
  );
}
