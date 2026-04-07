"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const MAX_DIST = 130;
const COUNT    = 80;

function makeParticles(w: number, h: number): Particle[] {
  return Array.from({ length: COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
  }));
}

export function ParticleNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ particles: Particle[]; raf: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) stateRef.current.particles = makeParticles(canvas.width, canvas.height);
    };

    resize();
    stateRef.current = { particles: makeParticles(canvas.width, canvas.height), raf: 0 };

    const draw = () => {
      const state = stateRef.current!;
      const w = canvas.width, h = canvas.height;
      const pts = state.particles;

      ctx.fillStyle = "rgb(5, 5, 15)";
      ctx.fillRect(0, 0, w, h);

      // Move and wrap particles
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -2)   p.x = w + 2;
        if (p.x > w + 2) p.x = -2;
        if (p.y < -2)   p.y = h + 2;
        if (p.y > h + 2) p.y = -2;
      }

      // Lines between close particles
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(120, 150, 255, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Dots
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(160, 180, 255, 0.70)";
        ctx.fill();
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.10, w / 2, h / 2, w * 0.85);
      vig.addColorStop(0,    "rgba(0,0,0,0)");
      vig.addColorStop(0.60, "rgba(0,0,0,0.20)");
      vig.addColorStop(1,    "rgba(0,0,0,0.78)");
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
