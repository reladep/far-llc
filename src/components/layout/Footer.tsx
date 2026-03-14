import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.05] bg-[#0F2538] text-white/30">
      <div className="mx-auto max-w-[1120px]">
        {/* Top grid */}
        <div className="grid border-b border-white/[0.06] gap-0 px-14 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="border-b border-white/[0.06] pb-8 pr-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12 lg:mr-10">
            <p className="mb-[10px] font-serif text-[20px] font-bold text-white">
              Visor <em className="not-italic text-[#2DBD74]">Index</em>
            </p>
            <p className="mb-5 max-w-[200px] text-[12px] leading-7">
              Independent intelligence for the most important financial decision of your life.
            </p>
            <p className="border-t border-white/[0.06] pt-4 text-[11px] leading-[1.5] text-[rgba(45,189,116,0.7)]">
              Conflict-free by design. Revenue from subscribers only — never from advisors.
            </p>
          </div>

          {/* Platform */}
          <div className="pt-8 lg:pl-10 lg:pt-0">
            <h3 className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">Platform</h3>
            <ul className="flex flex-col gap-[10px]">
              {[
                { label: 'Find Advisors', href: '/search' },
                { label: 'Rankings', href: '/directory' },
                { label: 'Compare Tool', href: '/compare' },
                { label: 'Matching', href: '/search' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-white/35 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="pt-8 lg:pt-0">
            <h3 className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">Company</h3>
            <ul className="flex flex-col gap-[10px]">
              {[
                { label: 'About', href: '/about' },
                { label: 'Methodology', href: '/how-it-works' },
                { label: 'Data Sources', href: '/how-it-works' },
                { label: 'Pricing', href: '/pricing' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-white/35 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="pt-8 lg:pt-0">
            <h3 className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">Legal</h3>
            <ul className="flex flex-col gap-[10px]">
              {[
                { label: 'Terms', href: '/terms' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Disclosures', href: '/disclosures' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-white/35 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-14 py-[18px] text-[11px]">
          <span>© {year} Visor Index · Data from SEC EDGAR · Not investment advice</span>
          <div className="flex gap-5">
            <Link href="#" className="uppercase tracking-[0.08em] text-white/20 transition hover:text-white/60">LinkedIn</Link>
            <Link href="#" className="uppercase tracking-[0.08em] text-white/20 transition hover:text-white/60">X</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
