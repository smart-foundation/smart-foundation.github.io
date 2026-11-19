import { createElement, useEffect, useMemo, useRef } from "react";
import { reducedMotion } from "../lib/store";

const GLYPHS = "01<>/\\+=_·:;|#";

type Props = {
  text: string;
  active: boolean;
  delay?: number;
  duration?: number;
  trigger?: number | string;
  className?: string;
  as?: string;
};

/**
 * Decodes text character by character — layout never shifts because every
 * glyph keeps its real width and only an overlay character is swapped.
 */
export default function Scramble({
  text,
  active,
  delay = 0,
  duration = 900,
  trigger = 0,
  className,
  as = "span",
}: Props) {
  const root = useRef<HTMLElement | null>(null);

  const lines = useMemo(
    () => text.split("\n").map((l) => l.split(" ").map((w) => w.split(""))),
    [text],
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>(".scr"));
    const n = chars.length;
    const thr = chars.map((_, i) => (i / Math.max(1, n)) * 0.62 + Math.random() * 0.3);

    const reveal = (c: HTMLElement) => {
      c.classList.remove("h", "g");
    };

    if (!active) {
      chars.forEach((c) => c.classList.add("h"));
      return;
    }
    if (reducedMotion) {
      chars.forEach(reveal);
      return;
    }

    chars.forEach((c) => {
      c.classList.add("h");
      c.classList.remove("g");
    });

    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = (now - start) / duration;
      let done = true;
      chars.forEach((c, i) => {
        if (p < 0) {
          done = false;
          return;
        }
        if (p >= thr[i] + 0.12) {
          reveal(c);
        } else if (p >= thr[i] - 0.18) {
          done = false;
          c.classList.remove("h");
          c.classList.add("g");
          if (Math.random() < 0.55) {
            c.dataset.g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        } else {
          done = false;
          c.classList.add("h");
          c.classList.remove("g");
        }
      });
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, trigger, text, delay, duration]);

  return createElement(
    as,
    { ref: root, className, "aria-label": text.replace(/\n/g, " ") },
    lines.map((words, li) => (
      <span key={li} aria-hidden className="contents">
        {li > 0 && <br />}
        {words.map((w, wi) => (
          <span key={wi} className="contents">
            {wi > 0 && " "}
            <span className="word">
              {w.map((c, ci) => (
                <span key={ci} className="scr h" data-g="0">
                  {c}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    )),
  );
}
