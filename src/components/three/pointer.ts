/**
 * Window-level pointer tracking for the 3D scenes.
 *
 * The hero canvas sits behind the content with `pointer-events: none`, so it
 * never receives pointer events and R3F's own `state.pointer` stays at zero.
 * Tracking on the window instead keeps parallax working while clicks pass
 * straight through to the buttons on top.
 *
 * One passive listener serves every scene, and the value lives in a module
 * object that consumers read inside their animation frame — so no matter how
 * many scenes are mounted, moving the mouse causes zero React renders.
 */

export type PointerState = {
  /** Normalised device coordinates: -1..1, y up. */
  x: number;
  y: number;
  /** Viewport pixels. */
  px: number;
  py: number;
  active: boolean;
};

const state: PointerState = { x: 0, y: 0, px: 0, py: 0, active: false };

let attached = false;

function onMove(event: PointerEvent) {
  state.px = event.clientX;
  state.py = event.clientY;
  state.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.y = -((event.clientY / window.innerHeight) * 2 - 1);
  state.active = true;
}

function onLeave() {
  state.active = false;
}

/** Idempotent; safe to call from every scene on every mount. */
export function ensurePointerTracking(): void {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
}

export function getPointer(): PointerState {
  return state;
}
