import { useEffect, useRef } from "react";

/** A single filled dot that inverts whatever it touches. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = dot.current!;
    let x = -100, y = -100, tx = -100, ty = -100, s = 1, ts = 1, raf = 0;

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
    };
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      ts = t?.closest("a,button") ? 4.2 : 1;
    };
    const leave = () => (el.style.opacity = "0");

    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      s += (ts - s) * 0.16;
      el.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0) scale(${s})`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-3 w-3 rounded-full bg-white opacity-0 mix-blend-difference"
    />
  );
}
