import { reducedMotion } from "../lib/store";

export type Band = {
  top: number;
  height: number;
  delay: number;
  dur: number;
  jx: number;
};
export type Fx = { id: number; bands: Band[] };

let counter = 0;

/** Full-height shards that reveal the new state slice by slice (used on inversion). */
export function makeFx(full: boolean): Fx {
  counter++;
  if (reducedMotion) return { id: counter, bands: [] };
  const bands: Band[] = [];
  if (full) {
    const n = 14;
    const w = Array.from({ length: n }, () => 0.35 + Math.random() * 1.4);
    const sum = w.reduce((a, b) => a + b, 0);
    let top = 0;
    w.forEach((v) => {
      const h = (v / sum) * 100;
      bands.push({
        top,
        height: h + 0.4,
        delay: Math.random() * 420,
        dur: 320 + Math.random() * 220,
        jx: (Math.random() - 0.5) * 70,
      });
      top += h;
    });
  } else {
    for (let i = 0; i < 5; i++) {
      bands.push({
        top: Math.random() * 96,
        height: 0.5 + Math.random() * 4.5,
        delay: Math.random() * 170,
        dur: 220 + Math.random() * 180,
        jx: (Math.random() - 0.5) * 140,
      });
    }
  }
  return { id: counter, bands };
}

export default function Bands({ fx }: { fx: Fx | null }) {
  if (!fx) return null;
  return (
    <div aria-hidden className="bands pointer-events-none fixed inset-0 z-50 overflow-hidden" key={fx.id}>
      {fx.bands.map((b, i) => (
        <div
          key={i}
          className="band"
          style={
            {
              top: `${b.top}%`,
              height: `${b.height}%`,
              "--delay": `${b.delay}ms`,
              "--dur": `${b.dur}ms`,
              "--jx": `${b.jx}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
