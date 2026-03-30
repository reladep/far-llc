'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedRowsProps {
  children: React.ReactNode;
}

export default function AnimatedRows({ children }: AnimatedRowsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-visible={visible ? 'true' : 'false'}>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-visible="false"] .vfp-client-type-fill,
        [data-visible="false"] .vfp-alloc-fill-mini { width: 0% !important; }
        [data-visible="true"] .vfp-client-type-fill,
        [data-visible="true"] .vfp-alloc-fill-mini { transition: width 0.7s cubic-bezier(0.25,0.46,0.45,0.94); }
        [data-visible="false"] .vfp-client-type-row,
        [data-visible="false"] .vfp-alloc-row { opacity: 0; transform: translateY(8px); }
        [data-visible="true"] .vfp-client-type-row,
        [data-visible="true"] .vfp-alloc-row {
          opacity: 1; transform: translateY(0);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
      `}} />
      {children}
    </div>
  );
}
