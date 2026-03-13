'use client';

import { useEffect, useState } from 'react';

interface Section {
  id: string;
  label: string;
}

interface SectionNavProps {
  sections: Section[];
}

export default function SectionNav({ sections }: SectionNavProps) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { threshold: 0.25, rootMargin: '-96px 0px -60% 0px' }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [sections]);

  return (
    <div style={{
      background: 'var(--white)',
      borderBottom: '1px solid var(--rule)',
      margin: '0 -56px',
      position: 'sticky',
      top: 96,
      zIndex: 300,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 56px',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
      }}>
        {sections.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: active === s.id ? 600 : 500,
              color: active === s.id ? 'var(--green)' : 'var(--ink-3)',
              textDecoration: 'none',
              padding: '14px 20px',
              whiteSpace: 'nowrap',
              borderBottom: active === s.id ? '2px solid var(--green)' : '2px solid transparent',
              transition: 'all 0.15s',
              letterSpacing: '0.02em',
            }}
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
