'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { GateConfig } from './types';

interface FirmTableGateProps {
  config: GateConfig;
  children: ReactNode;
}

export default function FirmTableGate({ config, children }: FirmTableGateProps) {
  return (
    <div className="relative">
      {/* Blurred firm rows */}
      <div
        className="pointer-events-none select-none overflow-hidden"
        style={{
          filter: 'blur(6px)',
          maxHeight: 480,
          maskImage: 'linear-gradient(to bottom, #000 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 40%, transparent 100%)',
        }}
      >
        {children}
      </div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(246,248,247,0) 0%, rgba(246,248,247,0.6) 40%, rgba(246,248,247,0.95) 100%)',
        }}
      />

      {/* CTA card */}
      <div className="absolute inset-x-0 top-[40px] flex justify-center" style={{ pointerEvents: 'auto' }}>
        <div className="max-w-[480px] max-sm:max-w-[calc(100%-32px)] w-full border border-white/[0.09] border-t-[2px] border-t-[#1A7A4A] bg-[#0F2538] shadow-[0_8px_48px_rgba(0,0,0,0.5)] px-10 py-9 max-sm:px-5 max-sm:py-7">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-3.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2DBD74] shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#2DBD74] font-mono">
              {config.eyebrowText}
            </span>
          </div>

          {/* Title */}
          <p className="font-serif text-[clamp(22px,2.5vw,30px)] font-bold text-white mb-2.5 leading-[1.15]">
            {config.title}
          </p>

          {/* Subtitle */}
          <p className="text-[13px] text-white/35 leading-[1.7] mb-6 border-t border-white/[0.06] pt-4 font-sans">
            {config.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex gap-2.5 flex-nowrap">
            <Link
              href={config.primaryCta.href}
              className="px-7 py-3 bg-[#1A7A4A] text-white text-[13px] font-semibold text-center whitespace-nowrap hover:bg-[#22995E] transition-colors font-sans"
            >
              {config.primaryCta.label}
            </Link>
            {config.secondaryCta && (
              <Link
                href={config.secondaryCta.href}
                className="px-7 py-3 border border-white/10 text-white/40 text-[13px] text-center whitespace-nowrap hover:border-white/30 hover:text-white transition-all font-sans"
              >
                {config.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
