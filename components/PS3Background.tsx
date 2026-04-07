"use client";

import { useEffect, useRef } from "react";

// Aurora borealis — curtains of colour that drift and ripple across a star field

interface Star {
  x: number; y: number;
  size: number;
  opacity: number;
  pulse: number;
  phase: number;
}

interface AuroraLayer {
  baseY: number;       // fraction of screen height
  amplitude: number;   // px
  frequency: number;   // spatial
  speed: number;       // temporal
  phase: number;
  color: [number, number, number];
  alpha: number;
  curtainH: number;    // fraction of screen height
}

function makeStars(w: number, h: number): Star[] {
  return Array.from({ length: 160 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() < 0.12 ? 1.4 : 0.7,
    opacity: 0.08 + Math.random() * 0.55,
    pulse: 0.004 + Math.random() * 0.014,
    phase: Math.random() * Math.PI * 2,
  }));
}

const LAYERS: AuroraLayer[] = [
  { baseY: 0.28, amplitude: 38, frequency: 0.0035, speed: 0.0025, phase: 0,              color: [0, 240, 140], alpha: 0.55, curtainH: 0.22 },
  { baseY: 0.36, amplitude: 52, frequency: 0.0025, speed: 0.0018, phase: Math.PI * 0.6,  color: [0, 210, 200], alpha: 0.40, curtainH: 0.28 },
  { baseY: 0.22, amplitude: 30, frequency: 0.0045, speed: 0.0032, phase: Math.PI * 1.2,  color: [80, 120, 255],alpha: 0.35, curtainH: 0.18 },
  { baseY: 0.42, amplitude: 45, frequency: 0.0020, speed: 0.0012, phase: Math.PI * 1.8,  color: [160, 60, 255],alpha: 0.28, curtainH: 0.24 },
];

function drawCurtain(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  layer: AuroraLayer,
  t: number,
) {
  const { baseY, amplitude, frequency, speed, phase, color, alpha, curtainH } = layer;
  const [r, g, b] = color;
  const by = baseY * h;
  const ch = curtainH * h;
  const step = 5;

  for (let x = 0; x <= w + step; x += step) {
    const waveY = by + Math.sin(x * frequency + t * speed + phase) * amplitude;
    const top   = waveY - ch * 0.06;
    const bot   = waveY + ch;

    const grad = ctx.createLinearGradient(x, top, x, bot);
    grad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
    grad.addColorStop(0.07, `rgba(${r},${g},${b},${alpha})`);
    grad.addColorStop(0.28, `rgba(${r},${g},${b},${alpha * 0.60})`);
    grad.addColorStop(0.60, `rgba(${r},${g},${b},${alpha * 0.20})`);
    grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(x, top, step + 1, bot - top);
  }
}

export function PS3Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ stars: Star[]; raf: number; t: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) stateRef.current.stars = makeStars(canvas.width, canvas.height);
    };

    resize();
    stateRef.current = { stars: makeStars(canvas.width, canvas.height), raf: 0, t: 0 };

    const draw = () => {
      const state = stateRef.current!;
      state.t += 1;
      const w = canvas.width, h = canvas.height;

      ctx.fillStyle = "rgb(2, 5, 16)";
      ctx.fillRect(0, 0, w, h);

      // Stars — draw before aurora so they peek through
      for (const star of state.stars) {
        const p = 0.45 + 0.55 * Math.sin(state.t * star.pulse + star.phase);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 230, 255, ${star.opacity * p})`;
        ctx.fill();
      }

      // Aurora curtains
      for (const layer of LAYERS) drawCurtain(ctx, w, h, layer, state.t);

      // Horizon glow where aurora meets the "ground"
      const horizY = h * 0.60;
      const hGlow = ctx.createLinearGradient(0, horizY, 0, h);
      hGlow.addColorStop(0, "rgba(0, 60, 40, 0)");
      hGlow.addColorStop(1, "rgba(0, 40, 30, 0.18)");
      ctx.fillStyle = hGlow;
      ctx.fillRect(0, horizY, w, h - horizY);

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.08, w / 2, h / 2, w * 0.85);
      vig.addColorStop(0,    "rgba(0,0,0,0)");
      vig.addColorStop(0.65, "rgba(0,0,0,0.20)");
      vig.addColorStop(1,    "rgba(0,0,0,0.75)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      state.raf = requestAnimationFrame(draw);
    };

    stateRef.current.raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (stateRef.current) cancelAnimationFrame(stateRef.current.raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", display: "block" }}
    />
  );
}
