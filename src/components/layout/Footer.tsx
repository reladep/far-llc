import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Search', href: '/search' },
    { label: 'Compare', href: '/compare' },
    { label: 'Directory', href: '/directory' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
    { label: 'How It Works', href: '/how-it-works' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', href: '/disclosures/privacy' },
    { label: 'Terms', href: '/disclosures/terms' },
    { label: 'Disclaimer', href: '/disclosures/disclaimer' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#091723] text-white">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div>
            <p className="font-serif text-3xl text-white">Visor Index</p>
            <p className="mt-3 max-w-xs text-sm leading-7 text-white/55">
              Search, compare, and diligence SEC-registered advisors with production-backed data, scoring, and workflow tools.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                {category}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Visor Index. All rights reserved.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
            Data sourced from SEC IAPD. Not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
