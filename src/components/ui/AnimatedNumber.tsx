"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (val: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 750,
  className,
  formatter,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);
  const isFirstRender = useRef<boolean>(true);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = isFirstRender.current ? 0 : prevValueRef.current;
    const endValue = value;
    isFirstRender.current = false;

    // If values are identical, set immediately and exit
    if (startValue === endValue) {
      setDisplayValue(endValue);
      prevValueRef.current = endValue;
      return;
    }

    const startTime = performance.now();

    const updateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateNumber);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const rendered = formatter ? formatter(displayValue) : displayValue.toLocaleString();

  return <span className={className}>{rendered}</span>;
}
