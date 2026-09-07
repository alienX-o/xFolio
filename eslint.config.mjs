import coreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * eslint-config-next 16 ships a flat config array, so it is spread directly.
 * Routing it through @eslint/eslintrc's FlatCompat instead throws a circular
 * structure error, and the shim buys nothing now.
 *
 * The TypeScript half of the Next preset is intentionally omitted: it loads
 * typescript-eslint, which does not yet support this TypeScript major.
 * `npm run typecheck` (tsc --noEmit) is what covers types.
 *
 * The exceptions below are scoped to the files where the rule genuinely does
 * not apply, never project-wide. Where a rule was right — Math.random() inside
 * a useMemo, a stale selection repaired by an effect — the code was changed
 * instead of the config.
 */
const config = [
  ...coreWebVitals,

  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },

  {
    /**
     * three.js scenes.
     *
     * Animation works by mutating live objects — `material.uniforms.x.value`,
     * `mesh.rotation.y` — from inside the render loop, sixty times a second.
     * That is the documented way to drive three.js and the only way that does
     * not allocate per frame, so `immutability` cannot apply here. The frame
     * callback also reads refs and the shared pointer by design; that is the
     * entire reason pointer tracking causes no React renders.
     */
    files: ["src/components/three/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },

  {
    /**
     * Environment probes.
     *
     * `matchMedia`, WebGL support and computed CSS variables cannot be read
     * during render without breaking hydration: the server has no answer for
     * any of them. The prescribed pattern is exactly what the rule flags —
     * render a neutral default, then set state once after mount. React's own
     * documentation calls this out as the legitimate use of an effect
     * ("subscribe to an external system"), but the rule cannot tell the
     * difference.
     */
    files: ["src/lib/hooks.ts", "src/lib/color.ts"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },

  {
    /**
     * Measured layout.
     *
     * The hero hands the WebGL title the real heading's bounding box, which is
     * only knowable after layout. Same story for the intro transition flag.
     */
    files: ["src/components/sections/Hero.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },

  {
    /**
     * Icon registries resolve a component from a config string, so the element
     * type is necessarily dynamic. `static-components` wants a literal.
     */
    files: [
      "src/components/sections/Skills.tsx",
      "src/components/sections/Custom.tsx",
      "src/components/chrome/Footer.tsx",
    ],
    rules: { "react-hooks/static-components": "off" },
  },

  {
    /**
     * The keyboard shortcut handler closes over the draft config, which is in
     * its dependency list; adding the save callback itself would rebind the
     * listener on every keystroke for no benefit.
     */
    files: ["src/components/admin/AdminApp.tsx"],
    rules: { "react-hooks/exhaustive-deps": "warn" },
  },
];

export default config;
