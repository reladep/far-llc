'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ */
/*  Scroll-triggered reveal                                           */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
        inView || reduced ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-7 opacity-0 blur-[2px]',
        className,
      )}
      style={{ transitionDelay: reduced ? '0ms' : `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tenets = [
  {
    num: '01',
    title: 'Not all wealth management firms are created equal.',
    body: 'Quality, sophistication, and value vary enormously across the industry. That\u2019s exactly what drove us to build the Visor Index Score\u2009\u2014\u2009a proprietary framework that cuts through the noise.',
  },
  {
    num: '02',
    title: 'Your situation is unique.',
    body: 'There\u2019s no universal \u201Cbest\u201D advisor. We help you identify the firms that match your specific circumstances, goals, and preferences.',
  },
  {
    num: '03',
    title: 'Transparency above all.',
    body: 'The fine print shouldn\u2019t live in the footnotes. We bring it to the front page.',
  },
  {
    num: '04',
    title: 'Fees should equal value.',
    body: 'The lowest fee doesn\u2019t always win. We look for firms reinvesting advisory revenue into better investment options and deeper service offerings\u2009\u2014\u2009firms that earn what they charge.',
  },
  {
    num: '05',
    title: 'Not everyone needs a financial advisor.',
    body: 'We\u2019re not in the business of pushing services on people who don\u2019t need them. Sometimes the right answer is dollar-cost averaging into index funds. We\u2019ll tell you that too.',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function AboutPageClient() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <>
      {/* ─── 1. HERO ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .about-hero { padding: 28px 16px 36px !important; }
          .about-section { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}} />
      <section
        className="about-hero relative overflow-hidden"
        style={{ background: '#0A1C2A', padding: '44px 48px 32px' }}
      >
        {/* Radial glow */}
        <div className="pointer-events-none" style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(45,189,116,.12) 0%, transparent 65%)' }} />

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 1, background: '#2DBD74', display: 'inline-block' }} />
              About Visor Index
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 7vw, 42px)', fontWeight: 700, color: '#fff', letterSpacing: '-.025em', lineHeight: 1.06, marginBottom: 0 }}>
              We&rsquo;re on your side.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.38)', lineHeight: 1.75, maxWidth: 500, marginTop: 12 }}>
              Visor Index exists for one reason: to give you the data, clarity,
              and leverage to make the most important financial decision of your
              life&thinsp;&mdash;&thinsp;choosing the right wealth partner.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── 2. ORIGIN STORY ─── */}
      <section className="about-section bg-[#F6F8F7] py-10 md:py-14" style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="border-t-2 border-[#2DBD74]/30 pt-8 md:pt-10" />
          <div className="space-y-8">
            <Reveal>
              <blockquote className="font-serif text-[clamp(26px,3.2vw,40px)] italic leading-[1.2] tracking-[-0.015em] text-[#0C1810]">
                &ldquo;How do I find a great financial advisor?&rdquo;
              </blockquote>
            </Reveal>

            <Reveal delay={120}>
              <div className="space-y-5 text-[14px] leading-7 text-[#5A7568] md:text-[15px]">
                <p>
                  It started with a question from a friend: <em className="text-[#2E4438]">How do I find a
                  great financial advisor?</em> As industry veterans, we thought we
                  knew the answer&thinsp;&mdash;&thinsp;find a firm run by
                  sophisticated investors, offering a full suite of services, at
                  fair value. Simple.
                </p>
                <p>
                  Then we went looking for a place on the internet that could
                  actually help someone do that. It doesn&rsquo;t exist.
                  Search &ldquo;find a financial advisor&rdquo; and you&rsquo;ll be
                  met with pages of matching services that get paid by the very
                  firms they recommend. A model perfectly designed for
                  everyone&thinsp;&mdash;&thinsp;except the client.
                </p>
                <p className="font-medium text-[#0C1810]">
                  We wanted to flip this model. That&rsquo;s why we created the{' '}
                  <span className="font-serif italic tracking-[0.02em]">
                    <span className="font-bold">VISOR</span>{' '}
                    <span className="font-bold text-[#2DBD74]">INDEX</span>
                  </span>
                  <sup style={{ fontSize: 8, verticalAlign: 'super', marginLeft: 1 }}>&trade;</sup>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── 3. STAKES ─── */}
      <section className="about-section bg-white" style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2DBD74]">
                Why it matters
              </p>
              <h2 className="mt-5 font-serif text-[clamp(30px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0C1810]">
                The biggest expense of your lifetime.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-8 flex gap-10 md:gap-14">
                {[
                  { value: '1%', label: 'fee difference' },
                  { value: '30+', label: 'years compounding' },
                  { value: '$100K+', label: 'potential cost' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-serif text-[26px] font-bold text-[#0C1810] md:text-[32px]">
                      {s.value}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5A7568]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-10 space-y-4 text-[14px] leading-7 text-[#5A7568] md:text-[15px]">
                <p>
                  For many people, a financial advisor is the single largest expense
                  of their lifetime&thinsp;&mdash;&thinsp;greater than healthcare,
                  education, or a mortgage. Fees compound. A one-percent difference
                  in annual fees, sustained over decades, can mean hundreds of
                  thousands of dollars.
                </p>
                <p>
                  Yet most people spend less time choosing their advisor than they
                  spend choosing a car. We think that should change.
                </p>
              </div>
            </Reveal>
        </div>
      </section>

      {/* ─── 4. VISION (dark band) ─── */}
      <section className="about-section bg-[#0a1c2a]" style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Reveal>
              <h2 className="font-serif text-[clamp(28px,3.8vw,48px)] font-bold leading-[1.12] tracking-[-0.02em] text-white">
                Your wealth. Your terms.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-8 space-y-4 text-[14px] leading-7 text-white/50 md:text-[15px]">
                <p>
                  Whether you&rsquo;re managing $100&thinsp;million or
                  $100&thinsp;thousand, Visor Index gives you the data, analysis,
                  and tools to find, evaluate, negotiate with, and track the right
                  wealth partner&thinsp;&mdash;&thinsp;on your terms.
                </p>
                <p>
                  Our incentives are aligned with yours. Subscribing to Visor Index
                  could save you multiples of what it costs.
                </p>
              </div>
            </Reveal>
        </div>
      </section>

      {/* ─── 5. CORE TENETS ─── */}
      <section className="about-section bg-[#F6F8F7]" style={{ padding: '40px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2DBD74]">
              What we believe
            </p>
            <h2 className="mt-4 font-serif text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.12] tracking-[-0.02em] text-[#0C1810]">
              Core Tenets
            </h2>
          </Reveal>

          <div className="mt-8 md:mt-10">
            {tenets.map((tenet, i) => (
              <Reveal key={tenet.num} delay={i * 60}>
                <div
                  className={cn(
                    'group border-t border-[#CAD8D0] py-6 transition-all duration-300 hover:border-l-2 hover:border-l-[#2DBD74] hover:pl-6 md:py-8',
                    i === tenets.length - 1 && 'border-b-0'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-sm font-semibold text-[#2DBD74]">
                        {tenet.num}
                      </span>
                      <h3 className="font-serif text-xl font-semibold leading-snug text-[#0C1810] md:text-[22px]">
                        {tenet.title}
                      </h3>
                    </div>
                    <p className="text-[14px] leading-7 text-[#5A7568] md:text-[15px]">
                      {tenet.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-[#CAD8D0]" />
          </div>
        </div>
      </section>

      {/* ─── 6. CLOSING CTA ─── */}
      <section className="about-section bg-[#0a1c2a]" style={{ padding: '56px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <Reveal>
              <h2 className="font-serif text-[clamp(30px,4.2vw,52px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
                Take Control of Your Financial Future.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <p className="mt-6 text-[14px] leading-7 text-white/45 md:text-[15px]">
                The right wealth partner can change the trajectory of your
                financial life. The wrong one can cost you more than you&rsquo;ll
                ever know. You now have the tools to tell the difference. Start
                with Visor Index today.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <Link
                  href={user ? '/search' : '/pricing'}
                  className="inline-flex w-full items-center justify-center bg-[#1A7A4A] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#22995E] sm:w-auto"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center border border-white/20 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70 transition-all duration-200 hover:border-white/40 hover:text-white sm:w-auto"
                >
                  Contact Us
                </Link>
              </div>
            </Reveal>
        </div>
      </section>
    </>
  );
}
