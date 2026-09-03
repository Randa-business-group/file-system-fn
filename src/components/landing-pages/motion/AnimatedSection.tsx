"use client";

import React, { useEffect, useRef, useState } from "react";

export type AnimationType =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "fade";

interface AnimatedSectionProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  as?: React.ElementType;
}

export function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
  className = "",
  as: Component = "div",
  style,
  ...props
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const getInitialTransform = () => {
    switch (animation) {
      case "fade-up":
        return "translate3d(0, 32px, 0)";
      case "fade-down":
        return "translate3d(0, -32px, 0)";
      case "fade-left":
        return "translate3d(36px, 0, 0)";
      case "fade-right":
        return "translate3d(-36px, 0, 0)";
      case "zoom-in":
        return "scale(0.94) translate3d(0, 16px, 0)";
      case "fade":
      default:
        return "translate3d(0, 0, 0)";
    }
  };

  const animatedStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translate3d(0, 0, 0) scale(1)" : getInitialTransform(),
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: isVisible ? "auto" : "opacity, transform",
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={className}
      style={animatedStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
