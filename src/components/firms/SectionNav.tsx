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
      <style dangerouslySetInnerHTML={{ __html: `.vfp-tab:hover { color:var(--ink-2) !important; }` }} />
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 56px',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        gap: 0,
      }}>
        {sections.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="vfp-tab"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(s.id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: active === s.id ? 600 : 500,
              color: active === s.id ? 'var(--ink)' : 'var(--ink-3)',
              textDecoration: 'none',
              padding: '11px 18px',
              whiteSpace: 'nowrap',
              borderBottom: active === s.id ? '2px solid #2DBD74' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
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
