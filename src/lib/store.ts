// Shared mutable state between the DOM layer and the WebGL stage.
// Kept outside React so the render loop never triggers re-renders.
export const SCENES = 6;

export const S = {
  target: 0, // scroll progress in scenes (raw)
  prog: 0, // smoothed progress used by shaders
  scene: 0,
  invert: false,
  layer: 3, // focused layer in the method scene
  burst: 0, // glitch burst 0..1 (decays)
  mouse: { x: 0, y: 0 }, // ndc target
  hover: false,
};

export const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
