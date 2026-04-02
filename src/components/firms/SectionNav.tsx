'use client';

import { useEffect, useState } from 'react';

interface Section {
  id: string;
  label: string;
}

interface SectionNavProps {
  sections: Section[];
}

const NAV_CSS = `
  .snav-wrap {
    background: var(--white);
    border-bottom: 1px solid var(--rule);
    margin: 0 -56px;
    position: sticky;
    top: 96px;
    z-index: 300;
  }
  .snav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 56px;
    display: flex;
    align-items: center;
    overflow-x: auto;
    gap: 0;
  }
  .snav-tab {
    display: block;
    font-size: 12px;
    text-decoration: none;
    padding: 11px 18px;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    letter-spacing: 0.02em;
  }
  .snav-tab:hover { color: var(--ink-2) !important; }
  .snav-tab-active { font-weight: 600; color: var(--ink); border-bottom-color: #2DBD74; }
  .snav-tab:not(.snav-tab-active) { font-weight: 500; color: var(--ink-3); }
  .snav-chevron { display: none; }

  @media (max-width: 640px) {
    .snav-wrap { margin: 0 -16px; top: 76px; }
    .snav-inner {
      flex-direction: column;
      align-items: stretch;
      overflow-x: visible;
      padding: 0;
    }
    .snav-tab {
      display: flex;
      justify-content: space-between;
      align-items: center;
      white-space: normal;
      padding: 14px 20px;
      font-size: 14px;
      text-align: left;
      border-bottom: 1px solid var(--rule);
      border-left: none;
    }
    .snav-tab:last-child { border-bottom: none; }
    .snav-tab-active { border-bottom: 1px solid var(--rule); border-left: 3px solid #2DBD74; }
    .snav-tab:last-child.snav-tab-active { border-bottom: none; }
    .snav-chevron { display: block; color: var(--ink-3); font-size: 16px; }
  }
`;

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
    <div className="snav-wrap">
      <style dangerouslySetInnerHTML={{ __html: NAV_CSS }} />
      <div className="snav-inner">
        {sections.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`snav-tab ${active === s.id ? 'snav-tab-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(s.id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {s.label}
            <span className="snav-chevron">›</span>
          </a>
        ))}
      </div>
    </div>
  );
}
