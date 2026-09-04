"use client";

import React, { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: string;
  duration?: number; // ms
  className?: string;
}

export function CountUp({ value, duration = 1800, className = "" }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    // Parse the value into number, prefix, suffix, and decimals
    // e.g. "500+" -> num=500, suffix="+", decimals=0
    // e.g. "50k+" -> num=50, suffix="k+", decimals=0
    // e.g. "99.9%" -> num=99.9, suffix="%", decimals=1
    // e.g. "4.8/5" -> num=4.8, suffix="/5", decimals=1
    const match = value.match(/^([^\d.]*)([\d.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1] || "";
    const targetNum = parseFloat(match[2]);
    const suffix = match[3] || "";
    const decimalParts = match[2].split(".");
    const decimals = decimalParts.length > 1 ? decimalParts[1].length : 0;

    if (isNaN(targetNum)) {
      setDisplayValue(value);
      return;
    }

    let startTime: number | null = null;
    let animFrameId: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentNum = easedProgress * targetNum;

      setDisplayValue(
        `${prefix}${currentNum.toFixed(decimals)}${suffix}`
      );

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animFrameId = requestAnimationFrame(step);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [hasAnimated, value, duration]);

  return (
    <span ref={elementRef} className={className} aria-label={value}>
      {hasAnimated ? displayValue : value}
    </span>
  );
}
