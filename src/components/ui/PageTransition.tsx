'use client';

import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true);
      return;
    }
    // Trigger on next frame for enter animation
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={cn('will-change-[opacity]', className)}
      style={{
        opacity: entered ? 1 : 0,
        transition: 'opacity 200ms cubic-bezier(0,0,0.2,1)',
      }}
    >
      {children}
    </div>
  );
}
