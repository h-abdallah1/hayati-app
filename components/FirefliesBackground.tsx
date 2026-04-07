"use client";

import { useEffect, useRef } from "react";

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  pulse: number;
  phase: number;
}

function makeFireflies(w: number, h: number): Firefly[] {
  return Array.from({ length: 55 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    radius: 1.5 + Math.random() * 2.0,
    baseOpacity: 0.3 + Math.random() * 0.6,
    pulse: 0.008 + Math.random() * 0.018,
    phase: Math.random() * Math.PI * 2,
  }));
}

export function FirefliesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ flies: Firefly[]; raf: number; t: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) stateRef.current.flies = makeFireflies(canvas.width, canvas.height);
    };

    resize();
    stateRef.current = { flies: makeFireflies(canvas.width, canvas.height), raf: 0, t: 0 };

    const draw = () => {
      const state = stateRef.current!;
      state.t++;
      const w = canvas.width, h = canvas.height;

      ctx.fillStyle = "rgb(2, 6, 4)";
      ctx.fillRect(0, 0, w, h);

      // Subtle green centre fog
      const fog = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.65);
      fog.addColorStop(0, "rgba(0, 60, 10, 0.10)");
      fog.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      for (const fly of state.flies) {
        // Move
        fly.x += fly.vx;
        fly.y += fly.vy;

        // Soft bounce at edges
        if (fly.x < 0 || fly.x > w) fly.vx *= -1;
        if (fly.y < 0 || fly.y > h) fly.vy *= -1;
        fly.x = Math.max(0, Math.min(w, fly.x));
        fly.y = Math.max(0, Math.min(h, fly.y));

        // Pulse opacity
        const p = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(state.t * fly.pulse + fly.phase));
        const alpha = fly.baseOpacity * p;

        // Glow
        const gr = fly.radius * 3.5;
        const glow = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, gr);
        glow.addColorStop(0,    `rgba(180, 255, 100, ${alpha})`);
        glow.addColorStop(0.35, `rgba(140, 240, 60,  ${alpha * 0.55})`);
        glow.addColorStop(1,    `rgba(80,  200, 20,  0)`);
        ctx.beginPath();
        ctx.arc(fly.x, fly.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(fly.x, fly.y, fly.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 255, 160, ${alpha * 0.9})`;
        ctx.fill();
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.08, w / 2, h / 2, w * 0.85);
      vig.addColorStop(0,    "rgba(0,0,0,0)");
      vig.addColorStop(0.55, "rgba(0,0,0,0.20)");
      vig.addColorStop(1,    "rgba(0,0,0,0.80)");
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
