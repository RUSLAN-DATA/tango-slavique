"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type CounterProps = {
  target: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

const easeOutExpo = (x: number): number =>
  x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

export function Counter({
  target,
  suffix = "",
  duration = 3.2,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }

    let raf = 0;
    const start = performance.now();
    const durationMs = duration * 1000;

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const easedProgress = easeOutExpo(progress);
      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`.trim()}>
      {count}
      {suffix}
    </span>
  );
}
