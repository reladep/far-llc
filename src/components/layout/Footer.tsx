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
    <footer className="border-t border-border bg-bg-secondary">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-text-primary">
                {category}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} FAR. All rights reserved.
          </p>
          <p className="text-xs text-text-tertiary">
            Data sourced from SEC IAPD. Not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
