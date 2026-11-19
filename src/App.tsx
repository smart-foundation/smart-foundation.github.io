import { useCallback, useEffect, useRef, useState } from "react";
import Stage from "./gl/Stage";
import Scramble from "./components/Scramble";
import Cursor from "./components/Cursor";
import Bands, { Fx, makeFx } from "./components/Bands";
import { S, SCENES } from "./lib/store";

const NAMES = ["foundation", "purpose", "method", "identity", "smart protocol", "work"];

// top → bottom as displayed. `layer` matches the disc index in the shader (0 = bottom).
const LAYERS = [
  { name: "Applications", layer: 3, desc: "What people use." },
  { name: "Interfaces", layer: 2, desc: "How they meet the system." },
  { name: "Engines", layer: 1, desc: "What does the work." },
  { name: "Foundations", layer: 0, desc: "What every part can rely on." },
];

const mono = "font-mono text-[10px] uppercase tracking-[0.28em]";
const pad = "px-6 md:px-12";

function Layer({
  on,
  className = "",
  children,
}: {
  on: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-on={on}
      aria-hidden={!on}
      className={`layer pointer-events-none fixed inset-0 z-10 ${className}`}
    >
      {children}
    </section>
  );
}

function Method({ on }: { on: boolean }) {
  const [layer, setLayer] = useState(3);
  const touched = useRef(0);

  useEffect(() => {
    S.layer = layer;
  }, [layer]);

  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => {
      if (performance.now() - touched.current < 6000) return;
      setLayer((l) => (l + 3) % 4);
    }, 3200);
    return () => window.clearInterval(id);
  }, [on]);

  const focus = (l: number) => {
    touched.current = performance.now();
    setLayer(l);
  };
  const current = LAYERS.find((l) => l.layer === layer)!;

  return (
    <Layer on={on} className={`flex items-end pb-[13vh] md:items-center md:pb-0 ${pad}`}>
      <div>
        <p className={`${mono} opacity-50`}>
          <Scramble text="how we build" active={on} />
        </p>
        <ul className="mt-6 md:mt-10">
          {LAYERS.map((l, i) => (
            <li key={l.name}>
              <button
                onPointerEnter={() => focus(l.layer)}
                onFocus={() => focus(l.layer)}
                onClick={() => focus(l.layer)}
                className="pointer-events-auto flex items-baseline gap-4 py-[0.1em] text-left text-[clamp(2rem,5.4vw,5.2rem)] font-extralight leading-[1.04] tracking-[-0.045em] transition-[opacity,transform] duration-700 md:gap-6"
                style={{
                  opacity: layer === l.layer ? 1 : 0.2,
                  transform: layer === l.layer ? "translateX(0.4em)" : "translateX(0)",
                }}
              >
                <span className={`${mono} w-6 translate-y-[-0.2em] !text-[9px] opacity-60`}>
                  0{i + 1}
                </span>
                <Scramble text={l.name} active={on} delay={150 + i * 110} />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-8 min-h-[3.2rem] max-w-[19rem] text-[13px] leading-relaxed opacity-60 md:mt-10">
          <Scramble text={current.desc} active={on} trigger={layer} duration={700} />
        </p>
      </div>
    </Layer>
  );
}

export default function App() {
  const [scene, setScene] = useState(0);
  const [fx, setFx] = useState<Fx | null>(null);
  const [cta, setCta] = useState(0);
  const spacer = useRef<HTMLDivElement>(null);

  const sectionH = () => spacer.current?.firstElementChild?.clientHeight || window.innerHeight;

  const goTo = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(SCENES - 1, i));
    window.scrollTo({ top: idx * sectionH(), behavior: "smooth" });
  }, []);

  // scroll → stage progress + scene changes
  useEffect(() => {
    const onScroll = () => {
      const h = sectionH();
      S.target = Math.max(0, Math.min(SCENES - 1, window.scrollY / h));
      const idx = Math.round(S.target);
      if (idx !== S.scene) {
        S.scene = idx;
        S.burst = Math.max(S.burst, 0.85);
        const inv = idx === 3;
        const flip = inv !== S.invert;
        S.invert = inv;
        setFx(makeFx(flip));
        setScene(idx);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // pointer + keys
  useEffect(() => {
    const move = (e: PointerEvent) => {
      S.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      S.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const key = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(S.scene + 1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(S.scene - 1);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", key);
    };
  }, [goTo]);

  return (
    <main data-inverted={scene === 3} className="relative text-[var(--ink)]">
      <Stage />

      {/* scroll spacers: the only thing that actually scrolls */}
      <div ref={spacer} aria-hidden>
        {Array.from({ length: SCENES }).map((_, i) => (
          <div key={i} className="snap h-screen" />
        ))}
      </div>

      {/* chrome */}
      <header className={`pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between pt-6 md:pt-10 ${pad}`}>
        <button
          onClick={() => goTo(0)}
          aria-label="Smart Foundation — back to start"
          className="pointer-events-auto flex items-center gap-3 text-[13px] font-normal tracking-[0.02em]"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />
          smart foundation
        </button>
        <p className={`${mono} flex gap-4 opacity-60`}>
          <span>0{scene + 1}</span>
          <Scramble text={NAMES[scene]} active trigger={scene} duration={600} />
        </p>
      </header>

      <nav
        aria-label="Scenes"
        className="fixed right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center md:right-6"
      >
        {NAMES.map((n, i) => (
          <button
            key={n}
            onClick={() => goTo(i)}
            aria-label={`Go to ${n}`}
            aria-current={scene === i}
            className="flex h-7 w-7 items-center justify-center"
          >
            <span
              className="block w-[5px] rounded-full bg-[var(--ink)] transition-all duration-500"
              style={{ height: scene === i ? 22 : 5, opacity: scene === i ? 1 : 0.28 }}
            />
          </button>
        ))}
      </nav>

      {/* 00 — foundation */}
      <Layer on={scene === 0} className={`flex flex-col justify-end pb-[13vh] md:pb-[15vh] ${pad}`}>
        <Scramble
          as="h1"
          text={"Change is constant.\nKeep what matters."}
          active={scene === 0}
          delay={scene === 0 ? 1100 : 0}
          duration={1400}
          className="text-[clamp(2.4rem,7.2vw,7.6rem)] font-extralight leading-[0.92] tracking-[-0.045em]"
        />
        <p className="mt-8 max-w-[24rem] text-[13px] leading-relaxed opacity-60 md:mt-10">
          <Scramble
            text="Smart Foundation is a software organization. We build systems, applications and tools."
            active={scene === 0}
            delay={scene === 0 ? 1950 : 300}
            duration={700}
          />
        </p>
        <div className="absolute bottom-8 right-6 flex flex-col items-center gap-3 md:right-12">
          <span className={`${mono} !text-[9px] opacity-45 [writing-mode:vertical-rl]`}>scroll</span>
          <span className="relative block h-8 w-1 overflow-hidden">
            <span className="drip absolute left-0 top-0 block h-1 w-1 rounded-full bg-[var(--ink)]" />
          </span>
        </div>
      </Layer>

      {/* 01 — purpose */}
      <Layer on={scene === 1} className={pad}>
        <Scramble
          as="h2"
          text={"Software people\ncan rely on."}
          active={scene === 1}
          delay={150}
          duration={1100}
          className="absolute left-6 top-[22vh] text-[clamp(2.2rem,5.8vw,6.2rem)] font-extralight leading-[0.95] tracking-[-0.045em] md:left-12"
        />
        <p className="absolute bottom-[13vh] right-6 max-w-[19rem] text-[13px] leading-relaxed opacity-60 md:right-20">
          <Scramble
            text={"Shipping is the easy part.\nKeeping it working is the job."}
            active={scene === 1}
            delay={700}
            duration={900}
          />
        </p>
      </Layer>

      {/* 02 — method */}
      <Method on={scene === 2} />

      {/* 03 — identity (inverted) */}
      <Layer on={scene === 3} className="flex flex-col items-center justify-end px-6 pb-[8vh] text-center">
        <Scramble
          as="h2"
          text={"Smart\nFoundation."}
          active={scene === 3}
          delay={250}
          duration={1100}
          className="text-[clamp(3rem,12vw,12rem)] font-thin leading-[0.82] tracking-[-0.065em]"
        />
        <p className="mt-8 max-w-sm text-[13px] leading-relaxed opacity-60 md:mt-10">
          <Scramble
            text="A software organization."
            active={scene === 3}
            delay={900}
            duration={900}
          />
        </p>
      </Layer>

      {/* 04 — smart protocol */}
      <Layer on={scene === 4} className={`flex items-end pb-[13vh] md:items-center md:pb-0 ${pad}`}>
        <div className="max-w-[28rem]">
          <Scramble
            as="h2"
            text="Smart Protocol."
            active={scene === 4}
            delay={200}
            duration={1100}
            className="text-[clamp(2.4rem,5.6vw,5.8rem)] font-extralight leading-[0.95] tracking-[-0.045em]"
          />
          <p className="mt-6 max-w-[22rem] text-[13px] leading-relaxed opacity-60 md:mt-8">
            <Scramble
              text="A shared set of interfaces that let software work together."
              active={scene === 4}
              delay={700}
              duration={900}
            />
          </p>
          <a
            href="https://github.com/smart-foundation/smart-protocol-official"
            target="_blank"
            rel="noreferrer"
            onPointerEnter={() => {
              S.burst = Math.max(S.burst, 0.75);
              setCta((c) => c + 1);
            }}
            className="group pointer-events-auto mt-8 inline-flex w-fit items-center gap-5 rounded-full bg-[var(--ink)] py-4 pl-7 pr-6 text-[14px] text-[var(--bg)] transition-transform duration-500 hover:scale-[1.03] md:mt-10"
          >
            <Scramble text="smart-protocol-official" active={scene === 4} trigger={cta} delay={cta ? 0 : 800} duration={700} />
            <span className="block h-2 w-2 rounded-full bg-[var(--bg)] transition-transform duration-500 group-hover:scale-[2.4]" />
          </a>
        </div>
      </Layer>

      {/* 05 — work */}
      <Layer on={scene === 5} className={`flex flex-col justify-end pb-[13vh] md:pb-[15vh] ${pad}`}>
        <div className="max-w-[26rem] border-t border-white/15 pt-5">
          <div className="grid gap-5 md:gap-6">
            <div>
              <Scramble
                as="h2"
                text="Smart Suite."
                active={scene === 5}
                delay={250}
                duration={900}
                className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-extralight leading-tight tracking-[-0.035em]"
              />
              <p className="mt-2 text-[13px] leading-relaxed opacity-60">
                <Scramble text="Files, photos, terminal and video." active={scene === 5} delay={450} duration={700} />
              </p>
            </div>
            <div>
              <Scramble
                as="h2"
                text="Developer tools."
                active={scene === 5}
                delay={400}
                duration={900}
                className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-extralight leading-tight tracking-[-0.035em]"
              />
              <p className="mt-2 text-[13px] leading-relaxed opacity-60">
                <Scramble text="Shared interfaces for building software." active={scene === 5} delay={600} duration={700} />
              </p>
            </div>
          </div>
        </div>
        <a
          href="https://github.com/smart-foundation"
          target="_blank"
          rel="noreferrer"
          onPointerEnter={() => {
            S.burst = Math.max(S.burst, 0.75);
            setCta((c) => c + 1);
          }}
          className="group pointer-events-auto mt-8 inline-flex w-fit items-center gap-5 rounded-full bg-[var(--ink)] py-4 pl-7 pr-6 text-[14px] text-[var(--bg)] transition-transform duration-500 hover:scale-[1.03] md:mt-10"
        >
          <Scramble text="github.com/smart-foundation" active={scene === 5} trigger={cta} delay={cta ? 0 : 800} duration={700} />
          <span className="block h-2 w-2 rounded-full bg-[var(--bg)] transition-transform duration-500 group-hover:scale-[2.4]" />
        </a>
        <div className="absolute bottom-6 right-6 flex items-center gap-8 md:bottom-10 md:right-12">
          <span className={`${mono} !text-[9px] opacity-40`}>© 2026 Smart Foundation</span>
          <button onClick={() => goTo(0)} className={`${mono} !text-[9px] pointer-events-auto opacity-70`}>
            start again
          </button>
        </div>
      </Layer>

      <Bands fx={fx} />
      <Cursor />
    </main>
  );
}
