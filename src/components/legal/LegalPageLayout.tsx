'use client';

import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LegalSection {
  id: string;
  num: string;
  title: string;
  content: ReactNode;
  /** Render inside a bordered callout box */
  callout?: boolean;
  /** Render in reduced-size uppercase mono for legal convention */
  legalCaps?: boolean;
}

export interface LegalPageLayoutProps {
  /** Page heading shown in the dark header */
  title: string;
  /** Date string shown after "Last Updated:" */
  lastUpdated: string;
  /** Introductory paragraph below the green rule */
  intro: ReactNode;
  /** Ordered sections of the document */
  sections: LegalSection[];
  /** Footer question text, e.g. "Questions about our Terms?" */
  footerQuestion: string;
  /** Footer mailto email */
  footerEmail: string;
}

/* ------------------------------------------------------------------ */
/*  Scroll-spy hook                                                    */
/* ------------------------------------------------------------------ */

function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [ids]);

  return activeId;
}

/* ------------------------------------------------------------------ */
/*  Shared text helpers                                                */
/* ------------------------------------------------------------------ */

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-4 first:mt-0', className)}>{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-4 space-y-2 pl-5">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-2 before:absolute before:left-[-12px] before:top-[0.65em] before:h-1 before:w-1 before:rounded-full before:bg-[#0a1c2a]/30">
      {children}
    </li>
  );
}

/** Bordered callout block for important disclosures */
export function Callout({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="my-6 border-l-2 border-[#2DBD74] bg-[#edf0ef] py-5 pl-6 pr-5">
      {label && (
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2DBD74]">
          {label}
        </p>
      )}
      <div className="text-[15px] leading-[1.75] text-[#0a1c2a]/75 md:text-[16px]">{children}</div>
    </div>
  );
}

/** Structured rights row for privacy rights lists */
export function RightRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="ml-4 border-b border-[#0a1c2a]/6 py-3 last:border-b-0">
      <span className="font-mono text-[13px] font-semibold text-[#0a1c2a]/80">{name}</span>
      <span className="text-[#0a1c2a]/50"> &mdash; </span>
      <span className="text-[15px] text-[#0a1c2a]/70">{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout component                                                   */
/* ------------------------------------------------------------------ */

export function LegalPageLayout({
  title,
  lastUpdated,
  intro,
  sections,
  footerQuestion,
  footerEmail,
}: LegalPageLayoutProps) {
  const sectionIds = sections.map((s) => s.id);
  const activeId = useScrollSpy(sectionIds);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on scroll
  useEffect(() => {
    const close = () => setMobileNavOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileNavOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f1]">
      {/* ─── PAGE HEADER ─── */}
      <header className="bg-[#0a1c2a] pb-12 pt-24 md:pb-16 md:pt-32">
        <div className="container-page">
          <h1 className="font-serif text-[clamp(32px,4.5vw,52px)] leading-[1.1] tracking-[-0.02em] text-white">
            {title}
          </h1>
          <p className="mt-4 font-mono text-[13px] tracking-[0.03em] text-white/40">
            Last Updated: {lastUpdated}
          </p>
          <div className="mt-6 h-px w-16 bg-[#2DBD74]/60" />
          <div className="mt-6 max-w-xl text-[15px] leading-7 text-white/45">{intro}</div>
        </div>
      </header>

      {/* ─── MOBILE SECTION NAV ─── */}
      <div className="sticky top-[56px] z-30 border-b border-[#0a1c2a]/8 bg-[#f0f2f1]/95 backdrop-blur lg:hidden">
        <div className="container-page py-3">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex w-full items-center justify-between rounded-md border border-[#0a1c2a]/10 bg-white px-4 py-2.5 text-[13px] font-medium text-[#0a1c2a]/70"
          >
            <span>Jump to Section</span>
            <svg
              className={cn('h-4 w-4 transition-transform', mobileNavOpen && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {mobileNavOpen && (
            <nav className="mt-2 max-h-[50vh] overflow-y-auto rounded-md border border-[#0a1c2a]/10 bg-white py-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    'block w-full px-4 py-2 text-left text-[13px] transition-colors',
                    activeId === s.id
                      ? 'font-medium text-[#1A7A4A]'
                      : 'text-[#0a1c2a]/65 hover:text-[#0a1c2a]/80',
                  )}
                >
                  <span className="mr-2 font-mono text-[11px] text-[#0a1c2a]/30">{s.num}</span>
                  {s.title}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="container-page pb-24 pt-10 lg:flex lg:gap-16 lg:pt-16">
        {/* ─── STICKY SIDEBAR (desktop) ─── */}
        <aside className="hidden lg:block lg:w-[240px] lg:shrink-0">
          <nav className="sticky top-[88px]">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0a1c2a]/35">
              Sections
            </p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  'block w-full border-l-2 py-2 pl-4 pr-2 text-left text-[13px] leading-snug transition-all duration-200',
                  activeId === s.id
                    ? 'border-[#2DBD74] font-medium text-[#0a1c2a]'
                    : 'border-transparent text-[#0a1c2a]/40 hover:border-[#0a1c2a]/10 hover:text-[#0a1c2a]/75',
                )}
              >
                <span className="mr-2 font-mono text-[11px] text-[#0a1c2a]/25">{s.num}</span>
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── CONTENT ─── */}
        <div className="min-w-0 max-w-[65ch] flex-1">
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              className={cn('scroll-mt-24', i > 0 && 'mt-12 border-t border-[#0a1c2a]/8 pt-12')}
            >
              <div className="mb-1 font-mono text-[12px] font-semibold text-[#2DBD74]">
                {section.num}
              </div>
              <h2 className="font-serif text-[22px] font-semibold leading-snug text-[#0a1c2a] md:text-[26px]">
                {section.title}
              </h2>

              {section.callout ? (
                <div className="mt-5 border-l-2 border-[#0a1c2a]/20 bg-[#eef1f0] py-5 pl-6 pr-5">
                  <div className="text-[15px] leading-[1.75] text-[#0a1c2a]/75 md:text-[16px]">
                    {section.content}
                  </div>
                </div>
              ) : section.legalCaps ? (
                <div className="mt-5 font-mono text-[13px] uppercase leading-[1.9] tracking-[0.01em] text-[#0a1c2a]/65 md:text-[13.5px]">
                  {section.content}
                </div>
              ) : (
                <div className="mt-5 text-[15px] leading-[1.75] text-[#0a1c2a]/75 md:text-[16px]">
                  {section.content}
                </div>
              )}
            </section>
          ))}

          {/* ─── FOOTER CTA ─── */}
          <div className="mt-16 border-t border-[#0a1c2a]/8 pt-12 text-center">
            <p className="text-[15px] text-[#0a1c2a]/50">{footerQuestion}</p>
            <a
              href={`mailto:${footerEmail}`}
              className="mt-2 inline-block text-[14px] font-medium text-[#1A7A4A] underline decoration-[#1A7A4A]/30 underline-offset-2 transition-colors hover:text-[#2DBD74]"
            >
              {footerEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
