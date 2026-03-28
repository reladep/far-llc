'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Scroll-triggered reveal (reuses project pattern)                  */
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
  return (
    <>
      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden bg-[#0a1c2a] pb-24 pt-28 md:pb-36 md:pt-40">
        {/* Subtle grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="container-page relative">
          <div className="max-w-3xl">
            <Reveal>
              <p className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-300/70">
                <span className="h-px w-8 bg-emerald-300/50" />
                About Visor Index
              </p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-8 font-serif text-[clamp(42px,6vw,76px)] leading-[1.05] tracking-[-0.025em] text-white">
                We&rsquo;re on your side.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-lg font-light leading-8 text-white/50 md:text-xl md:leading-9">
                Visor Index exists for one reason: to give you the data, clarity,
                and leverage to make the most important financial decision of your
                life&thinsp;&mdash;&thinsp;choosing the right wealth partner.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── 2. ORIGIN STORY ─── */}
      <section className="bg-[#f6f8f7] py-24 md:py-32">
        <div className="container-page">
          <div className="border-t-2 border-[#2DBD74]/30 pt-12 md:pt-16" />
          <div className="grid items-start gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:gap-20">
            <Reveal>
              <blockquote className="font-serif text-[clamp(28px,3.4vw,44px)] italic leading-[1.2] tracking-[-0.015em] text-[#0a1c2a]">
                &ldquo;It started with a question from a friend.&rdquo;
              </blockquote>
            </Reveal>

            <Reveal delay={120}>
              <div className="space-y-6 text-[16px] leading-7 text-[#0a1c2a]/70 md:text-[17px] md:leading-8">
                <p>
                  It started with a question from a friend: <em>How do I find a
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
                <p className="font-medium text-[#0a1c2a]/90">
                  We wanted to flip it. That&rsquo;s Visor Index.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── 3. STAKES ─── */}
      <section className="bg-white py-24 md:py-32">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2DBD74]">
                Why it matters
              </p>
              <h2 className="mt-6 font-serif text-[clamp(32px,4.2vw,56px)] leading-[1.1] tracking-[-0.02em] text-[#0a1c2a]">
                The biggest expense of your lifetime.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-10 flex justify-center gap-10 md:gap-16">
                {[
                  { value: '1%', label: 'fee difference' },
                  { value: '30+', label: 'years compounding' },
                  { value: '$100K+', label: 'potential cost' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-mono text-2xl font-bold text-[#0a1c2a] md:text-3xl">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#0a1c2a]/40">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="mx-auto mt-12 max-w-2xl space-y-5 text-[16px] leading-7 text-[#0a1c2a]/65 md:text-[17px] md:leading-8">
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
        </div>
      </section>

      {/* ─── 4. VISION (dark band) ─── */}
      <section className="bg-[#0a1c2a] py-24 md:py-32">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h2 className="font-serif text-[clamp(30px,4vw,52px)] leading-[1.12] tracking-[-0.02em] text-white">
                Your wealth. Your terms.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="mx-auto mt-10 max-w-2xl space-y-5 text-[16px] leading-7 text-white/50 md:text-[17px] md:leading-8">
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
        </div>
      </section>

      {/* ─── 5. CORE TENETS ─── */}
      <section className="bg-[#f6f8f7] py-24 md:py-32">
        <div className="container-page">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2DBD74]">
              What we believe
            </p>
            <h2 className="mt-5 font-serif text-[clamp(30px,3.8vw,48px)] leading-[1.12] tracking-[-0.02em] text-[#0a1c2a]">
              Core Tenets
            </h2>
          </Reveal>

          <div className="mt-14 md:mt-20">
            {tenets.map((tenet, i) => (
              <Reveal key={tenet.num} delay={i * 60}>
                <div
                  className="group border-t border-[#0a1c2a]/8 py-8 transition-all duration-300 hover:border-l-2 hover:border-l-[#2DBD74] hover:pl-6 md:py-10"
                >
                  <div className="grid items-baseline gap-4 md:grid-cols-[60px_1fr_1.2fr] md:gap-8">
                    <span className="font-mono text-sm font-semibold text-[#2DBD74]">
                      {tenet.num}
                    </span>
                    <h3 className="font-serif text-xl font-semibold leading-snug text-[#0a1c2a] md:text-[22px]">
                      {tenet.title}
                    </h3>
                    <p className="text-[15px] leading-7 text-[#0a1c2a]/60 md:text-[16px]">
                      {tenet.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            {/* Final bottom border */}
            <div className="border-t border-[#0a1c2a]/8" />
          </div>
        </div>
      </section>

      {/* ─── 6. CLOSING CTA ─── */}
      <section className="bg-[#0a1c2a] py-28 md:py-36">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="font-serif text-[clamp(32px,4.5vw,56px)] leading-[1.1] tracking-[-0.02em] text-[#f5f0eb]">
                Take Control of Your Financial Future.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <p className="mx-auto mt-8 max-w-xl text-[16px] leading-7 text-white/45 md:text-[17px] md:leading-8">
                The right wealth partner can change the trajectory of your
                financial life. The wrong one can cost you more than you&rsquo;ll
                ever know. You now have the tools to tell the difference. Start
                with Visor Index today.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <Link
                  href="/directory"
                  className="inline-flex w-full items-center justify-center bg-gradient-to-b from-[#1f8f55] to-[#1A7A4A] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_2px_12px_rgba(26,122,74,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:from-[#22995E] hover:to-[#1f8f55] hover:shadow-[0_4px_20px_rgba(45,189,116,0.3)] sm:w-auto"
                >
                  Find Your Advisor
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center border border-white/20 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70 transition-all duration-200 hover:border-white/40 hover:text-white sm:w-auto"
                >
                  Contact Us
                </Link>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <p className="mt-10 font-mono text-[11px] tracking-[0.04em] text-white/25">
                Based on SEC-registered ADV data. No affiliate fees. No referral kickbacks.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
