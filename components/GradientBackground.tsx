"use client";

import { useEffect, useRef } from "react";

// Slowly rotating multi-stop gradient with hue cycling

const STOPS = [
  { hue: 260, speed: 0.012, sat: 70, lit: 38 }, // violet
  { hue: 320, speed: 0.009, sat: 75, lit: 40 }, // magenta/rose
  { hue:  20, speed: 0.007, sat: 80, lit: 42 }, // amber/orange
  { hue: 185, speed: 0.010, sat: 68, lit: 36 }, // teal
  { hue: 230, speed: 0.008, sat: 72, lit: 35 }, // indigo
];

export function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ raf: number; t: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    stateRef.current = { raf: 0, t: 0 };

    const draw = () => {
      const state = stateRef.current!;
      state.t += 1;
      const t = state.t;
      const w = canvas.width, h = canvas.height;

      // Slowly rotating angle
      const angle = t * 0.0004;
      const cx = w / 2 + Math.sin(t * 0.0007) * w * 0.15;
      const cy = h / 2 + Math.cos(t * 0.0005) * h * 0.10;
      const r  = Math.sqrt(w * w + h * h) * 0.55;

      const x0 = cx + Math.cos(angle) * r;
      const y0 = cy + Math.sin(angle) * r;
      const x1 = cx - Math.cos(angle) * r;
      const y1 = cy - Math.sin(angle) * r;

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);

      STOPS.forEach((s, i) => {
        const hue = (s.hue + t * s.speed) % 360;
        const pos = i / (STOPS.length - 1);
        grad.addColorStop(pos, `hsl(${hue}, ${s.sat}%, ${s.lit}%)`);
      });

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Second pass — perpendicular overlay for depth
      const angle2 = angle + Math.PI / 2.4 + t * 0.00025;
      const x2 = cx + Math.cos(angle2) * r;
      const y2 = cy + Math.sin(angle2) * r;
      const x3 = cx - Math.cos(angle2) * r;
      const y3 = cy - Math.sin(angle2) * r;

      const grad2 = ctx.createLinearGradient(x2, y2, x3, y3);
      const h0 = (STOPS[2].hue + t * STOPS[2].speed) % 360;
      const h1 = (STOPS[4].hue + t * STOPS[4].speed) % 360;
      grad2.addColorStop(0,    `hsla(${h0}, 75%, 32%, 0.55)`);
      grad2.addColorStop(0.5,  `hsla(${(h0 + h1) / 2}, 60%, 20%, 0.30)`);
      grad2.addColorStop(1,    `hsla(${h1}, 72%, 34%, 0.55)`);

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, w * 0.85);
      vig.addColorStop(0,    "rgba(0,0,0,0)");
      vig.addColorStop(0.55, "rgba(0,0,0,0.15)");
      vig.addColorStop(1,    "rgba(0,0,0,0.65)");
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
