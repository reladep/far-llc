'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Saved Firms', href: '/dashboard/saved-firms', icon: '⭐' },
  { label: 'Comparisons', href: '/dashboard/comparisons', icon: '⚖️' },
  { label: 'Alerts', href: '/dashboard/alerts', icon: '🔔' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
];

function DashboardSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-bg-primary border-r border-border shadow-xl transition-transform duration-300 lg:relative lg:z-auto lg:h-auto lg:w-56 lg:shadow-none lg:translate-x-0 lg:shrink-0 lg:border-r-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4 lg:hidden">
          <span className="text-sm font-semibold text-text-primary">Menu</span>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary" aria-label="Close menu">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4 lg:p-0">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="rounded-lg px-3 py-2.5 lg:py-2 text-sm font-medium text-text-secondary hover:bg-secondary-100 hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <span className="lg:hidden">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

/* Mobile bottom tab bar */
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-bg-primary lg:hidden">
      <div className="flex items-center justify-around py-2">
        {sidebarLinks.slice(0, 5).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <span className="text-lg">{link.icon}</span>
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="container-page flex gap-6 lg:gap-8 py-6 md:py-8 pb-20 lg:pb-8">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary lg:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Menu
        </button>
        {children}
      </div>

      <MobileBottomNav />
    </div>
  );
}
