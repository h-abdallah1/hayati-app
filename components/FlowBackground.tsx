"use client";

import { useEffect, useRef } from "react";

// Mesh gradient — 5 large slow-drifting colour blobs that blend together
interface Blob {
  x: number; y: number;
  r: number;
  color: [number, number, number];
  opacity: number;
  phase: number;
  speedX: number; speedY: number;
  driftX: number; driftY: number;
}

const PALETTE: [number, number, number][] = [
  [109,  40, 217], // violet
  [6,   182, 212], // cyan
  [236,  72, 153], // pink
  [79,   70, 229], // indigo
  [5,   150, 105], // emerald
];

function makeBlobs(w: number, h: number): Blob[] {
  const diag = Math.sqrt(w * w + h * h);
  // Spread blobs evenly across the canvas rather than random clumping
  const positions = [
    [0.15, 0.25], [0.80, 0.20], [0.50, 0.70],
    [0.10, 0.75], [0.85, 0.65],
  ];
  return positions.map(([px, py], i) => ({
    x: px * w,
    y: py * h,
    r: diag * (0.50 + Math.random() * 0.25),
    color: PALETTE[i],
    opacity: 0.20 + Math.random() * 0.10,
    phase: (i / 5) * Math.PI * 2,
    speedX: 0.00008 + Math.random() * 0.00010,
    speedY: 0.00006 + Math.random() * 0.00008,
    driftX: w * 0.18 + Math.random() * w * 0.12,
    driftY: h * 0.14 + Math.random() * h * 0.10,
  }));
}

export function FlowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ blobs: Blob[]; raf: number; t: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) stateRef.current.blobs = makeBlobs(canvas.width, canvas.height);
    };

    resize();
    stateRef.current = { blobs: makeBlobs(canvas.width, canvas.height), raf: 0, t: 0 };

    const draw = () => {
      const state = stateRef.current!;
      state.t += 1;
      const w = canvas.width, h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgb(7, 5, 18)";
      ctx.fillRect(0, 0, w, h);

      for (const blob of state.blobs) {
        const ox = blob.x + Math.sin(state.t * blob.speedX + blob.phase) * blob.driftX;
        const oy = blob.y + Math.cos(state.t * blob.speedY + blob.phase * 0.7) * blob.driftY;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, blob.r);
        const [r, g, b] = blob.color;
        grad.addColorStop(0,    `rgba(${r},${g},${b},${blob.opacity})`);
        grad.addColorStop(0.30, `rgba(${r},${g},${b},${blob.opacity * 0.55})`);
        grad.addColorStop(0.60, `rgba(${r},${g},${b},${blob.opacity * 0.18})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(ox, oy, blob.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, w * 0.88);
      vig.addColorStop(0,   "rgba(0,0,0,0)");
      vig.addColorStop(0.55,"rgba(0,0,0,0.22)");
      vig.addColorStop(1,   "rgba(0,0,0,0.82)");
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
