"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { ensurePointerTracking, getPointer } from "./pointer";
import { FBM_3D, FRESNEL, SIMPLEX_3D } from "./shaders";

/**
 * The hero scenes, selected by `effects.heroScene`.
 *
 * `Dots` and `Grid` are the minimal defaults: a single near-monochrome
 * element, moving slowly, at low opacity. They are meant to be noticed only
 * on second glance. The rest are the loud options, kept because the theme is
 * configurable, but they are not what the site ships with.
 *
 * They share three conventions:
 *  - `intensity` (0..1 from config) scales counts, amplitude and speed, so
 *    turning it down is a real performance dial and not just a visual one;
 *  - pointer parallax reads the shared window pointer inside useFrame and
 *    lerps toward it, so nothing here triggers a React render on mouse move;
 *  - colors arrive as numbers resolved from the live CSS theme, which is what
 *    keeps the 3D in step with a color change made in the admin center.
 */

export type SceneProps = {
  intensity: number;
  colors: { primary: number; secondary: number; accent: number };
};

/**
 * Deterministic PRNG (mulberry32).
 *
 * Scene geometry is built inside useMemo, and Math.random() in a memo factory
 * is genuinely impure: React is free to invoke the factory more than once
 * (StrictMode double-renders, and the compiler may re-run it), which would
 * silently rebuild a different particle field. A fixed seed makes every build
 * byte-identical, so the memo is honest and a layout stays reproducible
 * between reloads.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Eased pointer follow shared by the scenes. Returns a sampler to call once
 * per frame; the easing is frame-rate independent, so it feels identical at
 * 60Hz and 144Hz.
 */
function useParallax(strength = 1) {
  const target = useRef(new THREE.Vector2());
  const current = useRef(new THREE.Vector2());

  useEffect(() => ensurePointerTracking(), []);

  return (delta: number) => {
    const p = getPointer();
    target.current.set(p.x * strength, p.y * strength);
    const t = 1 - Math.pow(0.0015, delta);
    current.current.lerp(target.current, t);
    return current.current;
  };
}

/* ------------------------------------------------------------------- dots */

/**
 * The default scene: a flat field of small points drifting on a plane, tilted
 * away from the camera so it reads as depth rather than as a starfield.
 *
 * Monochrome (theme `primary`, which in the minimal presets is a near-white or
 * near-black), low opacity, no additive blending and no colour mixing. The
 * intent is a faint texture behind the type, not a background you look at.
 */
export function Dots({ intensity, colors }: SceneProps) {
  const points = useRef<THREE.Points>(null);
  const parallax = useParallax(0.14);

  const count = Math.round(600 + intensity * 900);

  const geometry = useMemo(() => {
    const rng = mulberry32(0x5eed01);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    // Jittered grid rather than pure random: even coverage with no clumps.
    const columns = Math.ceil(Math.sqrt(count));
    const spread = 22;

    for (let i = 0; i < count; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const jitter = () => (rng() - 0.5) * (spread / columns) * 0.9;

      positions[i * 3] = (col / (columns - 1) - 0.5) * spread + jitter();
      positions[i * 3 + 1] = (row / (columns - 1) - 0.5) * spread + jitter();
      positions[i * 3 + 2] = (rng() - 0.5) * 1.2;
      seeds[i] = rng();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uColor: { value: new THREE.Color(colors.primary) },
        },
        vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        attribute float aSeed;
        varying float vFade;

        void main() {
          vec3 p = position;
          float s = aSeed * 6.2831853;

          // Barely-there drift. Slow enough that it never pulls the eye.
          p.z += sin(uTime * 0.22 + s) * 0.35 * uIntensity;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float dist = max(-mv.z, 0.6);
          gl_PointSize = (0.9 + aSeed * 0.7) * (90.0 / dist);

          // Fade with distance and give each point a fixed base opacity, so
          // the field has texture without any of it being prominent.
          vFade = smoothstep(30.0, 4.0, dist) * (0.25 + aSeed * 0.4);
        }
      `,
        fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vFade;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          if (length(uv) > 0.5) discard;
          gl_FragColor = vec4(uColor, vFade * 0.5);
        }
      `,
      }),
    [colors.primary, intensity],
  );

  useFrame((_, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    material.uniforms.uTime!.value += delta;
    const p = parallax(delta);
    // Fixed tilt plus a very small pointer response.
    mesh.rotation.x = -0.55 + p.y * 0.04;
    mesh.rotation.z = p.x * 0.03;
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      position={[0, 0, -2]}
      rotation={[-0.55, 0, 0]}
    />
  );
}

/* ------------------------------------------------------------------- grid */

/**
 * A single-colour wireframe plane in perspective, drifting very slightly.
 * Structural rather than decorative — it gives the hero a horizon line.
 */
export function Grid({ intensity, colors }: SceneProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const parallax = useParallax(0.12);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(40, 40, 30, 30),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        wireframe: true,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uColor: { value: new THREE.Color(colors.primary) },
        },
        vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying float vFade;

        void main() {
          vec3 p = position;
          float d = length(p.xy);

          // A long, shallow swell. Amplitude stays under half a unit even at
          // full intensity, so the grid never turns into a wave.
          p.z = sin(p.x * 0.16 + uTime * 0.28) * 0.22 * uIntensity
              + cos(p.y * 0.14 - uTime * 0.2) * 0.18 * uIntensity;

          // Fade toward the edges so the plane has no visible boundary.
          vFade = smoothstep(20.0, 3.0, d);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
        fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vFade;

        void main() {
          gl_FragColor = vec4(uColor, vFade * 0.10);
        }
      `,
      }),
    [colors.primary, intensity],
  );

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    material.uniforms.uTime!.value += delta;
    const p = parallax(delta);
    m.rotation.x = -Math.PI / 2.6 + p.y * 0.03;
    m.rotation.z = p.x * 0.02;
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      position={[0, -2.6, -2]}
      rotation={[-Math.PI / 2.6, 0, 0]}
    />
  );
}

/* -------------------------------------------------------------- particles */

export function Particles({ intensity, colors }: SceneProps) {
  const points = useRef<THREE.Points>(null);
  const parallax = useParallax(0.4);

  const count = Math.round(1200 + intensity * 3800);

  const geometry = useMemo(() => {
    const rng = mulberry32(0x5eed02);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // Rejection-free spherical shell: uniform direction, biased radius so
      // the middle stays open and the camera has something to look through.
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const radius = 2.2 + Math.pow(rng(), 0.6) * 3.4;

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.7;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

      scales[i] = 0.35 + rng() * 0.9;
      seeds[i] = rng();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [count]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uSize: { value: 1 },
        uColorA: { value: new THREE.Color(colors.primary) },
        uColorB: { value: new THREE.Color(colors.secondary) },
        uColorC: { value: new THREE.Color(colors.accent) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSize;
        attribute float aScale;
        attribute float aSeed;
        varying float vFade;
        varying float vSeed;

        void main() {
          vec3 p = position;
          float s = aSeed * 6.2831853;

          // Slow, uncorrelated drift per point.
          p.x += sin(uTime * 0.32 + s) * 0.30 * uIntensity;
          p.y += cos(uTime * 0.24 + s * 1.7) * 0.34 * uIntensity;
          p.z += sin(uTime * 0.19 + s * 2.3) * 0.30 * uIntensity;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          // Perspective size attenuation, clamped so near points stay sane.
          float dist = max(-mv.z, 0.6);
          gl_PointSize = uSize * aScale * (220.0 / dist);

          vFade = smoothstep(9.0, 2.0, dist);
          vSeed = aSeed;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying float vFade;
        varying float vSeed;

        void main() {
          // Round, soft-edged sprite from point coordinates.
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d);

          vec3 col = mix(uColorA, uColorB, vSeed);
          col = mix(col, uColorC, step(0.93, vSeed));

          gl_FragColor = vec4(col, alpha * vFade * 0.85);
        }
      `,
    });
  }, [colors.primary, colors.secondary, colors.accent, intensity]);

  useFrame((_, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    material.uniforms.uTime!.value += delta;
    const p = parallax(delta);
    mesh.rotation.y += delta * 0.045 * (0.4 + intensity);
    mesh.rotation.x = p.y * 0.25;
    mesh.rotation.z = p.x * 0.12;
  });

  return <points ref={points} geometry={geometry} material={material} />;
}

/* ------------------------------------------------------------------- blob */

export function Blob({ intensity, colors }: SceneProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const parallax = useParallax(0.5);

  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(1.75, 64),
    [],
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uColorA: { value: new THREE.Color(colors.primary) },
        uColorB: { value: new THREE.Color(colors.secondary) },
        uColorC: { value: new THREE.Color(colors.accent) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;

        ${SIMPLEX_3D}
        ${FBM_3D}

        void main() {
          vec3 p = position;
          float n = fbm(p * 0.9 + vec3(0.0, uTime * 0.16, 0.0));
          float disp = n * (0.18 + uIntensity * 0.42);
          p += normal * disp;

          // Recompute a normal from two nearby displaced samples so the
          // lighting follows the deformation instead of the base sphere.
          vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + 1e-4));
          vec3 bitangent = normalize(cross(normal, tangent));
          float eps = 0.06;
          vec3 pa = position + tangent * eps;
          vec3 pb = position + bitangent * eps;
          pa += normal * fbm(pa * 0.9 + vec3(0.0, uTime * 0.16, 0.0)) * (0.18 + uIntensity * 0.42);
          pb += normal * fbm(pb * 0.9 + vec3(0.0, uTime * 0.16, 0.0)) * (0.18 + uIntensity * 0.42);
          vNormal = normalize(cross(pa - p, pb - p)) * sign(dot(normal, normal));

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vView = normalize(-mv.xyz);
          vDisp = disp;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;

        ${FRESNEL}

        void main() {
          vec3 n = normalize(vNormal);
          float rim = fresnel(normalize(vView), n, 2.6);
          float lift = clamp(vDisp * 2.2 + 0.5, 0.0, 1.0);

          vec3 col = mix(uColorA, uColorB, lift);
          col = mix(col, uColorC, rim * 0.7);

          // Mostly rim-lit: a filled sphere would read as a flat circle.
          float alpha = 0.16 + rim * 0.8;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, [colors.primary, colors.secondary, colors.accent, intensity]);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    material.uniforms.uTime!.value += delta;
    const p = parallax(delta);
    m.rotation.y += delta * 0.12;
    m.rotation.x = p.y * 0.3;
    m.position.x = p.x * 0.35;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} />;
}

/* ------------------------------------------------------------------ waves */

export function Waves({ intensity, colors }: SceneProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const parallax = useParallax(0.3);

  const segments = Math.round(64 + intensity * 96);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(24, 24, segments, segments),
    [segments],
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      wireframe: true,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uColorA: { value: new THREE.Color(colors.primary) },
        uColorB: { value: new THREE.Color(colors.secondary) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying float vHeight;
        varying float vDist;

        ${SIMPLEX_3D}

        void main() {
          vec3 p = position;
          float d = length(p.xy);

          // Two travelling wave trains plus noise, faded out toward the rim
          // so the plane does not end in a hard edge.
          float h =
              sin(p.x * 0.42 + uTime * 0.8) * 0.34
            + cos(p.y * 0.36 - uTime * 0.6) * 0.30
            + snoise(vec3(p.xy * 0.16, uTime * 0.14)) * 0.75;

          float falloff = smoothstep(13.0, 2.0, d);
          p.z = h * (0.5 + uIntensity * 1.5) * falloff;

          vHeight = p.z;
          vDist = falloff;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying float vHeight;
        varying float vDist;

        void main() {
          float t = clamp(vHeight * 0.6 + 0.5, 0.0, 1.0);
          vec3 col = mix(uColorA, uColorB, t);
          gl_FragColor = vec4(col, vDist * (0.14 + t * 0.4));
        }
      `,
    });
  }, [colors.primary, colors.secondary, intensity]);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    material.uniforms.uTime!.value += delta;
    const p = parallax(delta);
    m.rotation.x = -Math.PI / 2.35 + p.y * 0.08;
    m.rotation.z = p.x * 0.08;
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      position={[0, -1.6, 0]}
      rotation={[-Math.PI / 2.35, 0, 0]}
    />
  );
}

/* ------------------------------------------------------------------ rings */

export function Rings({ intensity, colors }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const parallax = useParallax(0.45);

  const count = Math.round(5 + intensity * 9);

  const rings = useMemo(() => {
    const rng = mulberry32(0x5eed03);
    const palette = [colors.primary, colors.secondary, colors.accent];
    return Array.from({ length: count }, (_, i) => {
      const t = i / Math.max(1, count - 1);
      return {
        radius: 1.1 + t * 2.6,
        tube: 0.006 + (1 - t) * 0.012,
        color: palette[i % palette.length]!,
        speed: (0.16 + rng() * 0.3) * (i % 2 === 0 ? 1 : -1),
        tilt: [
          rng() * Math.PI,
          rng() * Math.PI,
          rng() * Math.PI,
        ] as [number, number, number],
      };
    });
  }, [count, colors.primary, colors.secondary, colors.accent]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const p = parallax(delta);
    g.rotation.y = p.x * 0.5;
    g.rotation.x = p.y * 0.4;
    g.children.forEach((child, i) => {
      child.rotation.z += delta * (rings[i]?.speed ?? 0.2);
      child.rotation.x += delta * 0.05;
    });
  });

  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={ring.tilt}>
          <torusGeometry args={[ring.radius, ring.tube, 3, 128]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- tunnel */

export function Tunnel({ intensity, colors }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const parallax = useParallax(0.6);

  const count = Math.round(18 + intensity * 34);
  const depth = 42;

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.primary),
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [colors.primary],
  );

  const accent = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.secondary),
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [colors.secondary],
  );

  const geometry = useMemo(
    () => new THREE.TorusGeometry(2.4, 0.012, 3, 96),
    [],
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const p = parallax(delta);
    g.position.x = p.x * 0.8;
    g.position.y = p.y * 0.6;

    const speed = 3 + intensity * 7;
    for (const child of g.children) {
      child.position.z += delta * speed;
      // Recycle a ring once it passes the camera.
      if (child.position.z > 3) child.position.z -= depth;
      child.rotation.z += delta * 0.25;
      const near = 1 - Math.min(1, Math.abs(child.position.z + 8) / 22);
      child.scale.setScalar(0.7 + near * 0.7);
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={i % 3 === 0 ? accent : material}
          position={[0, 0, -depth + (i / count) * depth]}
        />
      ))}
    </group>
  );
}
