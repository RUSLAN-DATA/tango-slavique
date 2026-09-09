"use client";

import { useEffect, useRef } from "react";

type Speck = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  twinkle: number;
  color: string;
};

const PALETTE = ["#F59E0B", "#FDE68A", "#D4AF37"];

export function CelestialDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      return;
    }

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let specks: Speck[] = [];

    function count() {
      return window.matchMedia("(max-width: 768px)").matches ? 140 : 160;
    }

    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeSpeck(resetY?: number): Speck {
      return {
        x: Math.random() * width,
        y: resetY ?? Math.random() * height,
        vx: -0.4 + Math.random() * 0.8,
        vy: -0.5 - Math.random() * 0.6,
        r: 1.2 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.01 + Math.random() * 0.02,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      };
    }

    function spawn() {
      specks = Array.from({ length: count() }, () => makeSpeck());
    }

    function hexToRgb(hex: string) {
      return {
        r: Number.parseInt(hex.slice(1, 3), 16),
        g: Number.parseInt(hex.slice(3, 5), 16),
        b: Number.parseInt(hex.slice(5, 7), 16),
      };
    }

    function tick() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(245, 158, 11, 0.6)";

      for (const speck of specks) {
        speck.x += speck.vx;
        speck.y += speck.vy;
        speck.phase += speck.twinkle;

        if (speck.y < -10) {
          Object.assign(speck, makeSpeck(height + 10));
        }
        if (speck.x < -10) speck.x = width + 10;
        if (speck.x > width + 10) speck.x = -10;

        const alpha = 0.35 + (Math.sin(speck.phase) * 0.5 + 0.5) * 0.4;
        const { r, g, b } = hexToRgb(speck.color);
        ctx.beginPath();
        ctx.arc(speck.x, speck.y, speck.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }

      if (running) {
        raf = requestAnimationFrame(tick);
      }
    }

    function start() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.visibilityState === "hidden"
      ) {
        ctx.clearRect(0, 0, width, height);
        return;
      }
      running = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }

    function onResize() {
      resize();
      if (specks.length !== count()) {
        spawn();
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        running = false;
        cancelAnimationFrame(raf);
        return;
      }
      start();
    }

    resize();
    spawn();
    start();

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] h-dvh w-screen"
    />
  );
}
