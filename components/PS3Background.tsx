"use client";

import { useEffect, useRef } from "react";

interface Wave {
  y: number;
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  vy: number;
  brightness: number; // 0–1, controls width and opacity
  colorIdx: number;
}

interface Star {
  x: number;
  y: number;
  opacity: number;
  pulseSpeed: number;
  phase: number;
  size: number;
}

// XMB cool palette — blues, cyans, soft whites
const WAVE_COLORS: [number, number, number][] = [
  [100, 180, 255], // sky blue
  [140, 210, 255], // light blue
  [80,  150, 220], // mid blue
  [170, 220, 255], // pale blue
  [120, 190, 240], // steel blue
];

function makeWaves(w: number, h: number): Wave[] {
  return Array.from({ length: 22 }, (_, i) => ({
    y:          (h / 22) * i + (Math.random() - 0.5) * (h / 10),
    amplitude:  18 + Math.random() * 55,
    frequency:  0.0008 + Math.random() * 0.0018,
    phase:      Math.random() * Math.PI * 2,
    speed:      0.004 + Math.random() * 0.006,
    vy:         (Math.random() - 0.5) * 0.06,
    brightness: Math.random(),
    colorIdx:   i % WAVE_COLORS.length,
  }));
}

function makeStars(w: number, h: number): Star[] {
  return Array.from({ length: 80 }, () => ({
    x:          Math.random() * w,
    y:          Math.random() * h,
    opacity:    0.1 + Math.random() * 0.5,
    pulseSpeed: 0.005 + Math.random() * 0.015,
    phase:      Math.random() * Math.PI * 2,
    size:       Math.random() < 0.15 ? 1.5 : 0.8,
  }));
}

function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: [number, number, number],
  brightness: number
) {
  if (points.length < 2) return;
  const [r, g, b] = color;
  const passes = [
    { width: 8,   alpha: 0.03 * brightness },
    { width: 3,   alpha: 0.07 * brightness },
    { width: 1.2, alpha: 0.25 * brightness },
    { width: 0.6, alpha: 0.55 * brightness },
  ];

  for (const pass of passes) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.strokeStyle = `rgba(${r},${g},${b},${pass.alpha})`;
    ctx.lineWidth = pass.width;
    ctx.stroke();
  }
}

export function PS3Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    waves: Wave[];
    stars: Star[];
    raf: number;
    t: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) {
        stateRef.current.waves = makeWaves(canvas.width, canvas.height);
        stateRef.current.stars = makeStars(canvas.width, canvas.height);
      }
    };

    resize();
    stateRef.current = {
      waves: makeWaves(canvas.width, canvas.height),
      stars: makeStars(canvas.width, canvas.height),
      raf: 0,
      t: 0,
    };

    const draw = () => {
      const state = stateRef.current!;
      state.t += 1;
      const w = canvas.width;
      const h = canvas.height;

      // Deep blue-black base
      ctx.fillStyle = "rgb(2, 5, 18)";
      ctx.fillRect(0, 0, w, h);

      // Subtle bottom gradient (XMB has slight color at bottom)
      const baseGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
      baseGrad.addColorStop(0, "rgba(0,0,0,0)");
      baseGrad.addColorStop(1, "rgba(20, 40, 90, 0.25)");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const star of state.stars) {
        const pulse = 0.6 + 0.4 * Math.sin(state.t * star.pulseSpeed + star.phase);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${star.opacity * pulse})`;
        ctx.fill();
      }

      // Sine waves
      ctx.lineJoin = "round";
      ctx.lineCap  = "round";

      for (const wave of state.waves) {
        // Drift vertically
        wave.y += wave.vy;
        if (wave.y < -100) wave.y = h + 100;
        if (wave.y > h + 100) wave.y = -100;

        const pts: [number, number][] = [];
        const step = 6;
        for (let x = 0; x <= w; x += step) {
          const y = wave.y + Math.sin(x * wave.frequency + state.t * wave.speed + wave.phase) * wave.amplitude;
          pts.push([x, y]);
        }

        const bri = 0.3 + wave.brightness * 0.7;
        drawGlowLine(ctx, pts, WAVE_COLORS[wave.colorIdx], bri);
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, w * 0.8);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.65)");
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
