import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.05] bg-[#0F2538] text-white/30">
      <div className="mx-auto max-w-[1120px]">
        {/* Top grid — brand left, link columns right */}
        <div className="grid border-b border-white/[0.06] gap-0 px-6 py-10 sm:px-10 lg:px-14 lg:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="border-b border-white/[0.06] pb-6 pr-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12 lg:mr-10">
            <p className="mb-[10px] font-serif text-[22px] font-bold italic tracking-[0.02em] text-white">
              VISOR<span className="ml-[0.12em] text-[#2DBD74]">INDEX</span>
            </p>
            <p className="mb-5 max-w-[260px] text-[12px] leading-[1.6]">
              Independent intelligence for the most important financial decision of your life.
            </p>
          </div>

          {/* Link columns — 3-col grid on mobile, individual cols on desktop */}
          <div className="grid grid-cols-3 gap-6 pt-6 lg:col-span-3 lg:contents lg:pt-0">
            {/* Platform */}
            <div className="lg:pl-10">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20 lg:mb-4">Platform</h3>
              <ul className="flex flex-col gap-[8px] lg:gap-[10px]">
                {[
                  { label: 'Find Advisors', href: '/search' },
                  { label: 'Rankings', href: '/directory' },
                  { label: 'Compare Tool', href: '/compare' },
                  { label: 'Matching', href: '/search' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[12px] text-white/35 transition hover:text-white lg:text-[13px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20 lg:mb-4">Company</h3>
              <ul className="flex flex-col gap-[8px] lg:gap-[10px]">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Methodology', href: '/how-it-works' },
                  { label: 'Data Sources', href: '/how-it-works' },
                  { label: 'Pricing', href: '/pricing' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[12px] text-white/35 transition hover:text-white lg:text-[13px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20 lg:mb-4">Legal</h3>
              <ul className="flex flex-col gap-[8px] lg:gap-[10px]">
                {[
                  { label: 'Terms', href: '/terms' },
                  { label: 'Privacy', href: '/privacy' },
                  { label: 'Disclosures', href: '/disclosures' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[12px] text-white/35 transition hover:text-white lg:text-[13px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-3 px-6 py-4 text-[11px] sm:flex-row sm:justify-between sm:px-10 lg:px-14 lg:py-[18px]">
          <span className="text-center sm:text-left">© {year} Visor Index · Data from SEC EDGAR · Not investment advice</span>
          <div className="flex gap-5">
            <Link href="#" className="uppercase tracking-[0.08em] text-white/20 transition hover:text-white/60">LinkedIn</Link>
            <Link href="#" className="uppercase tracking-[0.08em] text-white/20 transition hover:text-white/60">X</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
