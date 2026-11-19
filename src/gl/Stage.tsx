import { useEffect, useRef } from "react";
import { S, reducedMotion } from "../lib/store";

const VERT = /* glsl */ `#version 300 es
precision highp float;

in vec4 aSeed;
in vec2 aGrid;

uniform float uTime;
uniform float uProg;
uniform float uAspect;
uniform float uWide;
uniform float uDpr;
uniform float uSize;
uniform float uIntro;
uniform float uBurst;
uniform float uVel;
uniform vec2  uMouse;
uniform float uMouseV;
uniform vec4  uGlow;

out float vA;

const float PI = 3.14159265;
const float TAU = 6.28318530;

mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotZ(float a){ float c=cos(a), s=sin(a); return mat3(c,s,0., -s,c,0., 0.,0.,1.); }
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }

void shape(int id, vec4 s, vec2 g, out vec3 p, out vec2 info){
  float T = uTime;
  float o = uWide;
  float h1 = h11(s.x*91.7 + s.y*13.1);
  float h2 = h11(s.z*57.3 + s.w*31.7);

  if (id == 0) {
    // 00 — noise: dust and concentric shells, still undecided
    float th = s.x*TAU;
    float ph = acos(2.0*s.y - 1.0);
    float r = 1.7 + pow(s.z, 1.6)*4.6;
    if (s.w > 0.5) r = 1.7 + floor(pow(s.z, 1.15)*7.0)*0.68;
    vec3 b = vec3(sin(ph)*cos(th), cos(ph)*0.55, sin(ph)*sin(th)) * r;
    b = rotY(T*0.12/(0.5 + r*0.25)) * b;
    b += 0.26*vec3(sin(b.y*1.7 + T*0.5 + h1*6.0), sin(b.z*1.3 + T*0.4), sin(b.x*1.5 - T*0.45));
    b = rotZ(0.28) * b;
    p = b + vec3(o*2.3, 0.7, 0.0);
    info = vec2(0.28 + 0.72*h2, 0.7 + 0.9*h1);
  }
  else if (id == 1) {
    // 01 — contract: a calm, exact lattice
    float x = (g.x - 0.5)*9.0;
    float z = (g.y - 0.5)*9.0;
    float d = length(vec2(x, z));
    float y = sin(d*1.25 - T*0.9)*0.42/(1.0 + d*0.14) + sin(x*0.55 + T*0.35)*0.16;
    vec3 b = vec3(x, y, z);
    b = rotY(T*0.045) * b;
    b = rotX(0.98) * b;
    p = b + vec3(0.0, -0.2, 0.0);
    info = vec2(0.5 + 0.5*smoothstep(-0.4, 0.4, y), 1.0);
  }
  else if (id == 2) {
    // 02 — anatomy: four stacked discs
    float L = floor(s.w*4.0);
    float band = floor(sqrt(s.z)*20.0);
    float r = band/20.0*2.55 + 0.05;
    float dir = (mod(L, 2.0) < 0.5) ? 1.0 : -1.0;
    float ang = s.x*TAU + T*(0.10 + 0.012*band)*dir + L*1.3;
    float glow = (L < 0.5) ? uGlow.x : (L < 1.5) ? uGlow.y : (L < 2.5) ? uGlow.z : uGlow.w;
    float y = (L - 1.5)*1.18 + sin(r*3.0 - T*1.2 + L)*0.07 + glow*0.38;
    vec3 b = vec3(cos(ang)*r, y, sin(ang)*r);
    b = rotX(0.5) * b;
    p = b + vec3(o*2.7, 0.0, 0.0);
    info = vec2(0.16 + 0.84*glow, 0.85 + glow*0.7);
  }
  else if (id == 3) {
    // 03 — naledzi: a star system
    float arm = floor(s.w*3.0);
    float r = pow(s.z, 0.62)*4.3 + 0.04;
    float sc = (s.x - 0.5) + (s.y - 0.5);
    float th = r*1.22 + arm*2.0944 + sc*(0.18 + 0.1*r) + T*0.28/(1.0 + r*0.55);
    float y = (h1 - 0.5)*0.4*exp(-r*0.42);
    vec3 b = vec3(cos(th)*r, y, sin(th)*r);
    b = rotX(0.95) * b;
    b = rotZ(-0.2) * b;
    p = b + vec3(0.0, 1.0, 0.0);
    info = vec2(mix(1.0, 0.35, r/4.3), 0.8 + 1.6*exp(-r*1.6));
  }
  else {
    // 04 — open: an orb of latitudes and one slow ring
    vec3 b;
    if (s.w > 0.88) {
      float a = s.x*TAU + T*0.2;
      float r = 3.3 + s.z*0.2 + sin(a*3.0 + T)*0.05;
      b = vec3(cos(a)*r, (h1 - 0.5)*0.03, sin(a)*r);
      info = vec2(0.55, 1.0);
    } else {
      float band = floor(s.x*46.0);
      float th = (band + 0.5)/46.0*PI;
      float lon = s.y*TAU;
      float R = 2.05 + 0.1*sin(th)*sin(th*6.0 + T*1.2)*sin(lon*3.0 + T*0.8);
      b = vec3(sin(th)*cos(lon), cos(th), sin(th)*sin(lon))*R;
      b = rotY(T*0.14 + band*0.0) * b;
      info = vec2(0.45 + 0.55*h2, 0.9 + 0.5*h1);
    }
    b = rotX(0.42) * rotZ(0.3) * b;
    p = b + vec3(o*1.5, 0.35, 0.0);
  }
}

void main(){
  float pr = clamp(uProg, 0.0, 4.0);
  float fa = min(floor(pr), 3.0);
  float t = pr - fa;
  int ia = int(fa);
  int ib = ia + 1;

  vec3 pA, pB; vec2 iA, iB;
  shape(ia, aSeed, aGrid, pA, iA);
  shape(ib, aSeed, aGrid, pB, iB);

  // radial dissolve: the middle leaves first
  float dl = 0.45*smoothstep(0.0, 6.0, length(pA));
  float tt = clamp(t*1.45 - dl, 0.0, 1.0);
  tt = tt*tt*(3.0 - 2.0*tt);
  float gT = 4.0*t*(1.0 - t);

  vec3 nz = vec3(h11(aSeed.x*17.0), h11(aSeed.y*29.0), h11(aSeed.z*43.0)) - 0.5;
  vec3 p = mix(pA, pB, tt) + nz*sin(PI*tt)*3.2;
  vec2 info = mix(iA, iB, tt);

  // digital snap: space quantises mid-transition
  float q = gT*gT*0.6;
  if (q > 0.02) p = floor(p/q + 0.5)*q;

  p *= 1.0 + uBurst*0.05;
  p += nz*uBurst*0.45;

  float ie = clamp(uIntro*1.5 - h11(aSeed.w*71.0)*0.5, 0.0, 1.0);
  ie = 1.0 - pow(1.0 - ie, 3.0);
  p *= ie;

  p = rotZ(uVel*0.12) * (rotY(uMouse.x*0.2) * (rotX(-uMouse.y*0.13) * p));

  float w = 10.0 - p.z;
  const float F = 2.4142;
  vec2 ndc = vec2(p.x*F/uAspect, p.y*F)/w;

  // the cursor bends the field
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  float f = exp(-dist*dist*13.0);
  vec2 dir = d/(dist + 1e-4);
  vec2 push = (dir*0.11 + vec2(-dir.y, dir.x)*0.075)*f*(1.0 + uMouseV*1.5);
  push.x /= uAspect;
  ndc += push;

  // scroll streaks
  ndc.y += uVel*(aSeed.w - 0.5)*0.28;

  // horizontal tearing
  float g = max(gT*0.9, uBurst);
  if (g > 0.04) {
    float row = floor((ndc.y*0.5 + 0.5)*40.0);
    float tk = floor(uTime*12.0);
    float hr = h11(row*1.7 + tk*3.3);
    if (hr > 0.8) ndc.x += (h11(row + tk) - 0.5)*0.35*g;
  }

  gl_Position = vec4(ndc*w, 0.0, w);
  gl_PointSize = max(1.2, uSize*uDpr*(10.0/w)*info.y*(1.0 + f*1.1));

  float depth = 0.45 + 0.55*smoothstep(18.0, 6.0, w);
  vA = clamp(info.x*(0.6 + f*0.9)*depth*ie, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
in float vA;
uniform vec3 uInk;
out vec4 o;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.18, d)*vA;
  if (a < 0.01) discard;
  o = vec4(uInk, a);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
  }
  return sh;
}

export default function Stage() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const small = window.innerWidth < 700;
    const G = small ? 150 : 210;
    const N = G * G;
    const seeds = new Float32Array(N * 4);
    const grid = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = Math.random();
      grid[i * 2] = (i % G) / (G - 1);
      grid[i * 2 + 1] = Math.floor(i / G) / (G - 1);
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const bind = (name: string, data: Float32Array, size: number) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    bind("aSeed", seeds, 4);
    bind("aGrid", grid, 2);

    const U: Record<string, WebGLUniformLocation | null> = {};
    [
      "uTime", "uProg", "uAspect", "uWide", "uDpr", "uSize", "uIntro",
      "uBurst", "uVel", "uMouse", "uMouseV", "uGlow", "uInk",
    ].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let aspect = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      aspect = w / h;
    };
    resize();
    window.addEventListener("resize", resize);

    const glow = [0, 0, 0, 0];
    const mouse = { x: 0, y: 0 };
    let mouseV = 0;
    let ink = 1; // 1 = white particles on black
    let raf = 0;
    let last = performance.now();
    const t0 = last;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = (now - t0) / 1000;

      const k = reducedMotion ? 12 : 4.2;
      S.prog += (S.target - S.prog) * (1 - Math.exp(-dt * k));
      const vel = Math.max(-1, Math.min(1, (S.target - S.prog) * 0.9));

      const mx = mouse.x, my = mouse.y;
      mouse.x += (S.mouse.x - mouse.x) * (1 - Math.exp(-dt * 7));
      mouse.y += (S.mouse.y - mouse.y) * (1 - Math.exp(-dt * 7));
      const sp = Math.hypot(mouse.x - mx, mouse.y - my) / Math.max(dt, 0.001);
      mouseV += (Math.min(sp, 3) - mouseV) * (1 - Math.exp(-dt * 5));

      for (let i = 0; i < 4; i++) {
        glow[i] += ((S.layer === i ? 1 : 0) - glow[i]) * (1 - Math.exp(-dt * 6));
      }
      S.burst *= Math.exp(-dt * 3.2);
      const intro = Math.min(1, (now - t0) / (reducedMotion ? 600 : 3400));
      ink = S.invert ? 0 : 1;

      const bg = 1 - ink;
      gl.clearColor(bg, bg, bg, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(U.uTime, reducedMotion ? time * 0.25 : time);
      gl.uniform1f(U.uProg, S.prog);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform1f(U.uWide, Math.max(0, Math.min(1, (aspect - 0.95) / 0.5)));
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uSize, 1.55);
      gl.uniform1f(U.uIntro, intro);
      gl.uniform1f(U.uBurst, S.burst);
      gl.uniform1f(U.uVel, vel);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uMouseV, mouseV);
      gl.uniform4f(U.uGlow, glow[0], glow[1], glow[2], glow[3]);
      gl.uniform3f(U.uInk, ink, ink, ink);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, N);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 h-full w-full" aria-hidden />;
}
