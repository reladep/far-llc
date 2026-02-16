'use client';

import { useRef, useEffect, useState, Children, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  staggerMs?: number;
  /** Base delay before first child in ms */
  baseDelay?: number;
  /** Animation duration per child in ms */
  duration?: number;
  /** IntersectionObserver rootMargin */
  rootMargin?: string;
}

export function StaggerGroup({
  children,
  className,
  staggerMs = 80,
  baseDelay = 0,
  duration = 400,
  rootMargin = '-60px',
}: StaggerGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={cn(className)}>
      {Children.map(children, (child, i) => (
        <div
          className="will-change-[transform,opacity]"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : 'translateY(20px)',
            transition: `opacity ${duration}ms cubic-bezier(0,0,0.2,1) ${baseDelay + i * staggerMs}ms, transform ${duration}ms cubic-bezier(0,0,0.2,1) ${baseDelay + i * staggerMs}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
