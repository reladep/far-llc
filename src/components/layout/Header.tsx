'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border backdrop-blur supports-[backdrop-filter]:bg-bg-primary/60 transition-all duration-300 ease-out',
        scrolled
          ? 'bg-bg-primary shadow-sm'
          : 'bg-bg-primary/95'
      )}
    >
      <div
        className={cn(
          'container-page flex items-center justify-between transition-[height] duration-300 ease-out',
          scrolled ? 'h-14' : 'h-16'
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">FAR</span>
          <span className="hidden text-sm text-text-muted sm:inline">
            Find an Advisor
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/search"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Search
          </Link>
          <Link
            href="/compare"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/directory"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
