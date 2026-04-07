"use client";

import { useEffect, useRef } from "react";

// Deep space starfield — 3 parallax star layers + faint nebula dust clouds

interface Star {
  x: number; y: number;
  size: number;
  opacity: number;
  pulse: number;
  phase: number;
  layer: number; // 0=far, 1=mid, 2=close
}

interface Nebula {
  x: number; y: number;
  rx: number; ry: number;
  color: [number, number, number];
  opacity: number;
  phase: number;
  speed: number;
}

const LAYER_SPEEDS = [0.010, 0.022, 0.038]; // drift per frame

function makeStars(w: number, h: number): Star[] {
  const counts = [220, 90, 30];
  const stars: Star[] = [];
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < counts[layer]; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: layer === 0 ? 0.55 : layer === 1 ? 0.9 : 1.4,
        opacity: layer === 0
          ? 0.08 + Math.random() * 0.35
          : layer === 1
          ? 0.20 + Math.random() * 0.50
          : 0.50 + Math.random() * 0.40,
        pulse: layer === 2 ? 0.006 + Math.random() * 0.012 : 0.002 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2,
        layer,
      });
    }
  }
  return stars;
}

function makeNebulae(w: number, h: number): Nebula[] {
  return [
    { x: w * 0.25, y: h * 0.30, rx: w * 0.40, ry: h * 0.35, color: [80,  20, 140], opacity: 0.055, phase: 0,             speed: 0.00006 },
    { x: w * 0.72, y: h * 0.55, rx: w * 0.38, ry: h * 0.30, color: [10,  60, 130], opacity: 0.060, phase: Math.PI * 0.8, speed: 0.00005 },
    { x: w * 0.50, y: h * 0.80, rx: w * 0.45, ry: h * 0.28, color: [140, 20,  60], opacity: 0.040, phase: Math.PI * 1.5, speed: 0.00007 },
    { x: w * 0.85, y: h * 0.15, rx: w * 0.30, ry: h * 0.25, color: [20,  80, 120], opacity: 0.045, phase: Math.PI * 0.4, speed: 0.00004 },
  ];
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ stars: Star[]; nebulae: Nebula[]; raf: number; t: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) {
        stateRef.current.stars   = makeStars(canvas.width, canvas.height);
        stateRef.current.nebulae = makeNebulae(canvas.width, canvas.height);
      }
    };

    resize();
    stateRef.current = {
      stars:   makeStars(canvas.width, canvas.height),
      nebulae: makeNebulae(canvas.width, canvas.height),
      raf: 0, t: 0,
    };

    const draw = () => {
      const state = stateRef.current!;
      state.t += 1;
      const w = canvas.width, h = canvas.height;

      ctx.fillStyle = "rgb(2, 3, 12)";
      ctx.fillRect(0, 0, w, h);

      // Nebula clouds — drawn first, very subtle
      for (const neb of state.nebulae) {
        const ox = neb.x + Math.sin(state.t * neb.speed + neb.phase) * w * 0.04;
        const oy = neb.y + Math.cos(state.t * neb.speed + neb.phase) * h * 0.03;
        const [r, g, b] = neb.color;

        // Use scaling to create an elliptical gradient
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(1, neb.ry / neb.rx);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.rx);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${neb.opacity})`);
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${neb.opacity * 0.45})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, neb.rx, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Stars — drift slowly (parallax)
      for (const star of state.stars) {
        star.x -= LAYER_SPEEDS[star.layer];
        if (star.x < -2) star.x = w + 2;

        const p = 0.55 + 0.45 * Math.sin(state.t * star.pulse + star.phase);
        const alpha = star.opacity * (star.layer === 2 ? p : 0.8 + 0.2 * p);

        // Bright close stars get a tiny glow
        if (star.layer === 2) {
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
          glow.addColorStop(0,   `rgba(200, 220, 255, ${alpha * 0.5})`);
          glow.addColorStop(1,   "rgba(200,220,255,0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 225, 255, ${alpha})`;
        ctx.fill();
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.10, w / 2, h / 2, w * 0.80);
      vig.addColorStop(0,   "rgba(0,0,0,0)");
      vig.addColorStop(0.6, "rgba(0,0,0,0.15)");
      vig.addColorStop(1,   "rgba(0,0,0,0.72)");
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
