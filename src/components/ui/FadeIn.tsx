'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Animation variant */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Duration in ms */
  duration?: number;
  /** Delay in ms */
  delay?: number;
  /** IntersectionObserver rootMargin */
  rootMargin?: string;
  /** Only animate once */
  once?: boolean;
}

export function FadeIn({
  children,
  className,
  direction = 'up',
  duration = 500,
  delay = 0,
  rootMargin = '-80px',
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  const translateMap = {
    up: 'translateY(24px)',
    down: 'translateY(-24px)',
    left: 'translateX(24px)',
    right: 'translateX(-24px)',
    none: 'none',
  };

  return (
    <div
      ref={ref}
      className={cn('will-change-[transform,opacity]', className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : translateMap[direction],
        transition: `opacity ${duration}ms cubic-bezier(0,0,0.2,1) ${delay}ms, transform ${duration}ms cubic-bezier(0,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
