"use client";

import { useEffect, useRef } from "react";

const CHARS = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";

const FONT_SIZE = 14;

interface Column {
  x: number;
  y: number;       // head y in chars
  speed: number;   // chars per frame (fractional)
  trail: number;   // trail length in chars
  chars: string[]; // random chars for each row in trail
  tick: number;    // fractional accumulator
}

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function makeColumns(w: number, h: number): Column[] {
  const cols = Math.floor(w / FONT_SIZE);
  return Array.from({ length: cols }, (_, i) => ({
    x: i * FONT_SIZE,
    y: -Math.floor(Math.random() * (h / FONT_SIZE)),
    speed: 0.04 + Math.random() * 0.20,
    trail: 8 + Math.floor(Math.random() * 14),
    chars: Array.from({ length: 32 }, randomChar),
    tick: 0,
  }));
}

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ cols: Column[]; raf: number; frame: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current) stateRef.current.cols = makeColumns(canvas.width, canvas.height);
    };

    resize();
    stateRef.current = { cols: makeColumns(canvas.width, canvas.height), raf: 0, frame: 0 };

    const draw = () => {
      const state = stateRef.current!;
      const w = canvas.width, h = canvas.height;
      const rows = Math.ceil(h / FONT_SIZE) + 2;

      state.frame++;

      // Fade trail using semi-transparent fill (classic Matrix trick)
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${FONT_SIZE}px monospace`;

      for (const col of state.cols) {
        col.tick += col.speed;
        if (col.tick >= 1) {
          col.tick -= 1;
          col.y += 1;
          // Randomise a char in the trail occasionally
          const ri = Math.floor(Math.random() * col.chars.length);
          col.chars[ri] = randomChar();
        }

        if (col.y - col.trail > rows) {
          col.y = -Math.floor(Math.random() * 10);
          col.speed = 0.04 + Math.random() * 0.20;
          col.trail = 8 + Math.floor(Math.random() * 14);
        }

        for (let i = 0; i < col.trail; i++) {
          const row = col.y - i;
          if (row < 0 || row > rows) continue;
          const charIdx = ((row % col.chars.length) + col.chars.length) % col.chars.length;
          const ch = col.chars[charIdx];

          if (i === 0) {
            // Head — bright white
            ctx.fillStyle = "rgba(220, 255, 220, 0.95)";
          } else {
            const fade = 1 - i / col.trail;
            const g = Math.floor(80 + fade * 175);
            ctx.fillStyle = `rgba(0, ${g}, 0, ${0.15 + fade * 0.75})`;
          }

          ctx.fillText(ch, col.x, row * FONT_SIZE);
        }
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
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", display: "block" }}
    />
  );
}
