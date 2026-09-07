"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { ensurePointerTracking, getPointer } from "./pointer";
import { SIMPLEX_3D } from "./shaders";

/**
 * 3D display text, drawn on a 2D canvas and then distorted on the GPU.
 *
 * The usual way to get dimensional text in three.js is an extruded font
 * (Text3D) or an SDF atlas, and both need a font file shipped and loaded
 * before anything can render. This takes a different route: paint the string
 * into a plain 2D canvas with the same webfont the rest of the page uses,
 * upload that as a texture, and let a fragment shader push the sampling
 * around. That means:
 *
 *  - no font assets, no loader, and no second copy of the typeface;
 *  - whatever `theme.fonts.heading` is set to is what appears, automatically;
 *  - the distortion is per-pixel, so we get liquid ripple and RGB fringing
 *    that geometry-based text cannot do cheaply.
 *
 * The trade-off is that this is a flat plane, not real 3D geometry — it reads
 * as dimensional through parallax, the pointer bulge and the aberration rather
 * than through actual depth. For display text at this size that reads better
 * than extrusion, and it costs one draw call.
 */

const DESIGN_FONT_SIZE = 260;
const PADDING = 48;
const MAX_TEXTURE_WIDTH = 4096;

type TextTexture = { texture: THREE.CanvasTexture; aspect: number };

/**
 * Paints the string to a canvas at high resolution and wraps it as a texture.
 * Returns null until the webfont has actually loaded — drawing earlier would
 * bake the fallback typeface into the texture.
 */
function useTextTexture(text: string, weight: number): TextTexture | null {
  const [result, setResult] = useState<TextTexture | null>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;

    const build = async () => {
      // Use the same stack the DOM resolved, so the texture matches the page.
      const stack =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--x-font-heading")
          .trim() || "system-ui, sans-serif";

      const fontSpec = `${weight} ${DESIGN_FONT_SIZE}px ${stack}`;

      try {
        // Ask for this exact face, then wait for every pending font. Without
        // this the first paint uses the fallback and never updates.
        await document.fonts.load(fontSpec, text);
        await document.fonts.ready;
      } catch {
        // Font loading API unavailable or the family failed; draw anyway.
      }
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.font = fontSpec;
      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent || DESIGN_FONT_SIZE * 0.8;
      const descent =
        metrics.actualBoundingBoxDescent || DESIGN_FONT_SIZE * 0.2;

      const rawWidth = Math.ceil(metrics.width) + PADDING * 2;
      // Very long names would blow past the max texture size; scale the whole
      // drawing down rather than clipping the string.
      const scale = Math.min(1, MAX_TEXTURE_WIDTH / rawWidth);

      const width = Math.max(2, Math.round(rawWidth * scale));
      const height = Math.max(
        2,
        Math.round((ascent + descent + PADDING * 2) * scale),
      );

      canvas.width = width;
      canvas.height = height;

      // Resizing the canvas resets the context, so re-apply everything.
      ctx.scale(scale, scale);
      ctx.font = fontSpec;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, PADDING, PADDING + ascent);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;

      created = texture;
      if (!cancelled) setResult({ texture, aspect: width / height });
    };

    void build();

    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [text, weight, gl]);

  return result;
}

/**
 * Where the text should sit, in canvas pixels. Passing the measured bounding
 * box of the real <h1> is what lets the WebGL title line up exactly with the
 * DOM heading it replaces — the heading stays in the document for semantics
 * and layout, rendered invisible, and this draws over its footprint. Without a
 * box the text simply centres itself.
 */
export type TextBox = { x: number; y: number; width: number; height: number };

export function ShaderText({
  text,
  weight = 700,
  intensity,
  colors,
  widthFraction = 0.86,
  box,
}: {
  text: string;
  weight?: number;
  intensity: number;
  colors: { primary: number; secondary: number; accent: number };
  /** Share of the viewport width the text should span when `box` is absent. */
  widthFraction?: number;
  box?: TextBox | null;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const built = useTextTexture(text, weight);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);

  useEffect(() => ensurePointerTracking(), []);

  const material = useMemo(() => {
    if (!built) return null;
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: built.texture },
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColorA: { value: new THREE.Color(colors.primary) },
        uColorB: { value: new THREE.Color(colors.secondary) },
        uColorC: { value: new THREE.Color(colors.accent) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uPointer;
        varying vec2 vUv;
        varying float vBulge;

        void main() {
          vUv = uv;
          vec3 p = position;

          // Gentle standing wave across the plane, plus a bulge toward the
          // cursor. Together they give the flat plane a sense of surface.
          float wave =
              sin(p.x * 1.9 + uTime * 0.9) * 0.5
            + cos(p.y * 3.1 - uTime * 0.7) * 0.5;

          vec2 pointerUv = uPointer * 0.5 + 0.5;
          float d = distance(uv, pointerUv);
          float bulge = smoothstep(0.42, 0.0, d);

          p.z += wave * 0.06 * uIntensity + bulge * 0.30 * uIntensity;

          vBulge = bulge;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uPointer;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec2 vUv;
        varying float vBulge;

        ${SIMPLEX_3D}

        void main() {
          vec2 uv = vUv;

          // Slow noise drift, plus concentric ripples radiating from the
          // cursor. Both feed the sampling offset rather than the geometry,
          // which is what makes the letters look like they are made of fluid.
          float n = snoise(vec3(uv * 3.2, uTime * 0.22));
          vec2 pointerUv = uPointer * 0.5 + 0.5;
          float d = distance(uv, pointerUv);
          float ripple = sin(d * 26.0 - uTime * 4.2) * smoothstep(0.4, 0.0, d);

          vec2 offset = vec2(n * 0.5, ripple) * 0.008 * (0.35 + uIntensity);

          // Chromatic aberration: each channel samples the mask at a slightly
          // different place, so edges pick up colour fringes.
          float ca = (0.0022 + abs(ripple) * 0.007) * (0.35 + uIntensity);
          float r = texture2D(uMap, uv + offset + vec2(ca, 0.0)).a;
          float g = texture2D(uMap, uv + offset).a;
          float b = texture2D(uMap, uv + offset - vec2(ca, 0.0)).a;

          float mask = max(max(r, g), b);
          if (mask < 0.008) discard;

          vec3 grad = mix(uColorA, uColorB, clamp(uv.x + n * 0.18, 0.0, 1.0));
          grad = mix(grad, uColorC, clamp(abs(ripple) * 1.3 + vBulge * 0.4, 0.0, 1.0));

          // Weight the gradient by the per-channel coverage to expose the
          // fringing, then pull most of the way back so it stays legible.
          vec3 fringed = grad * (vec3(r, g, b) / max(mask, 0.001));
          vec3 col = mix(grad, fringed, 0.75);

          gl_FragColor = vec4(col, mask);
        }
      `,
    });
  }, [built, intensity, colors.primary, colors.secondary, colors.accent]);

  useEffect(() => () => material?.dispose(), [material]);

  useFrame((_, delta) => {
    if (!material) return;
    material.uniforms.uTime!.value += delta;

    const p = getPointer();
    const uniform = material.uniforms.uPointer!.value as THREE.Vector2;
    // Ease toward the pointer so the ripple trails rather than snapping.
    const t = 1 - Math.pow(0.002, delta);
    uniform.x += (p.x - uniform.x) * t;
    uniform.y += (p.y - uniform.y) * t;

    const m = mesh.current;
    if (m) {
      m.rotation.y = p.x * 0.06;
      m.rotation.x = -p.y * 0.04;
    }
  });

  if (!built || !material) return null;

  // Pixels per world unit on the z=0 plane. Keeping the text at z=0 means this
  // single number converts the DOM box straight into world space with no
  // perspective correction.
  const factor = viewport.width > 0 ? size.width / viewport.width : 1;

  let width: number;
  let position: [number, number, number] = [0, 0, 0];

  if (box && box.width > 0) {
    width = box.width / factor;
    position = [
      (box.x + box.width / 2 - size.width / 2) / factor,
      -(box.y + box.height / 2 - size.height / 2) / factor,
      0,
    ];
  } else {
    width = Math.min(viewport.width * widthFraction, 26);
  }

  const height = width / built.aspect;

  return (
    <mesh ref={mesh} material={material} position={position}>
      {/* Segmented so the vertex-stage bulge has vertices to move. */}
      <planeGeometry args={[width, height, 48, 24]} />
    </mesh>
  );
}
