"use client";

import { useEffect, useRef } from "react";

interface Orb {
  x: number;
  y: number;
  r: number;
  color: [number, number, number];
  opacity: number;
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
}

interface Spark {
  x: number;
  y: number;
  r: number;
  color: [number, number, number];
  opacity: number;
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
  pulseSpeed: number;
}

const COLORS: [number, number, number][] = [
  [107, 77,  235], // #6B4DEB purple
  [125, 212, 245], // #7DD4F5 sky
  [245, 146, 42],  // #F5922A orange
  [232, 80,  106], // #E8506A rose
  [196, 168, 242], // #C4A8F2 lavender
];

function makeOrbs(w: number, h: number): Orb[] {
  const diag = Math.sqrt(w * w + h * h);
  return Array.from({ length: 6 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: diag * (0.55 + Math.random() * 0.35),
    color: COLORS[i % COLORS.length],
    opacity: 0.09 + Math.random() * 0.07,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0002 + Math.random() * 0.0003,
    driftX: w * 0.30 + Math.random() * w * 0.20,
    driftY: h * 0.25 + Math.random() * h * 0.20,
  }));
}

function makeSparks(w: number, h: number): Spark[] {
  const diag = Math.sqrt(w * w + h * h);
  return Array.from({ length: 5 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: diag * (0.25 + Math.random() * 0.20),
    color: COLORS[(i + 2) % COLORS.length],
    opacity: 0.22 + Math.random() * 0.18,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0004 + Math.random() * 0.0005,
    driftX: w * 0.20 + Math.random() * w * 0.15,
    driftY: h * 0.15 + Math.random() * h * 0.15,
    pulseSpeed: 0.003 + Math.random() * 0.004,
  }));
}

function drawOrb(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  color: [number, number, number], opacity: number
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  const [rv, g, b] = color;
  grad.addColorStop(0,   `rgba(${rv},${g},${b},${opacity})`);
  grad.addColorStop(0.4, `rgba(${rv},${g},${b},${opacity * 0.5})`);
  grad.addColorStop(1,   `rgba(${rv},${g},${b},0)`);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

export function FlowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    orbs: Orb[];
    sparks: Spark[];
    raf: number;
    t: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) {
        stateRef.current.orbs = makeOrbs(canvas.width, canvas.height);
        stateRef.current.sparks = makeSparks(canvas.width, canvas.height);
      }
    };

    resize();

    stateRef.current = {
      orbs: makeOrbs(canvas.width, canvas.height),
      sparks: makeSparks(canvas.width, canvas.height),
      raf: 0,
      t: 0,
    };

    const draw = () => {
      const state = stateRef.current!;
      state.t += 1;
      const w = canvas.width;
      const h = canvas.height;

      // Dark base
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgb(8, 7, 14)";
      ctx.fillRect(0, 0, w, h);

      // Large atmospheric blobs — very subtle color zones
      for (const orb of state.orbs) {
        const ox = orb.x + Math.sin(state.t * orb.speed + orb.phase) * orb.driftX;
        const oy = orb.y + Math.cos(state.t * orb.speed * 0.8 + orb.phase) * orb.driftY;
        drawOrb(ctx, ox, oy, orb.r, orb.color, orb.opacity);
      }

      // Dark vignette to keep edges black and center moody
      const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.85);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // Smaller glowing sparks on top — pulsing
      for (const spark of state.sparks) {
        const ox = spark.x + Math.sin(state.t * spark.speed + spark.phase) * spark.driftX;
        const oy = spark.y + Math.cos(state.t * spark.speed * 1.3 + spark.phase) * spark.driftY;
        const pulse = 0.75 + 0.25 * Math.sin(state.t * spark.pulseSpeed + spark.phase);
        drawOrb(ctx, ox, oy, spark.r * pulse, spark.color, spark.opacity * pulse);
        drawOrb(ctx, ox, oy, spark.r * 0.18, spark.color, spark.opacity);
      }

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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
