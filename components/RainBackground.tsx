"use client";

import { useEffect, useRef } from "react";

interface Drop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

function makeDrops(w: number, h: number): Drop[] {
  return Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speed: 8 + Math.random() * 12,
    length: 10 + Math.random() * 18,
    opacity: 0.15 + Math.random() * 0.40,
  }));
}

const ANGLE = (10 * Math.PI) / 180; // 10° slant
const DX = Math.sin(ANGLE);
const DY = Math.cos(ANGLE);

export function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ drops: Drop[]; raf: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) stateRef.current.drops = makeDrops(canvas.width, canvas.height);
    };

    resize();
    stateRef.current = { drops: makeDrops(canvas.width, canvas.height), raf: 0 };

    const draw = () => {
      const state = stateRef.current!;
      const w = canvas.width, h = canvas.height;

      ctx.fillStyle = "rgb(8, 10, 14)";
      ctx.fillRect(0, 0, w, h);

      // Raindrops
      for (const d of state.drops) {
        d.x += d.speed * DX;
        d.y += d.speed * DY;
        if (d.y > h + d.length) {
          d.y = -d.length - Math.random() * 60;
          d.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.length * DX, d.y - d.length * DY);
        ctx.strokeStyle = `rgba(160, 200, 240, ${d.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // City glow at bottom
      const glow = ctx.createLinearGradient(0, h * 0.75, 0, h);
      glow.addColorStop(0, "rgba(255, 140, 40, 0)");
      glow.addColorStop(1, "rgba(255, 120, 30, 0.13)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.85);
      vig.addColorStop(0,    "rgba(0,0,0,0)");
      vig.addColorStop(0.6,  "rgba(0,0,0,0.18)");
      vig.addColorStop(1,    "rgba(0,0,0,0.72)");
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
