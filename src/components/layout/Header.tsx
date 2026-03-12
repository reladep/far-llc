'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

const supabase = createSupabaseBrowserClient();

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-white/8 backdrop-blur supports-[backdrop-filter]:bg-[#0a1c2a]/70 transition-all duration-300 ease-out',
        scrolled
          ? 'bg-[#0a1c2a]/95 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.65)]'
          : 'bg-[#0a1c2a]/82'
      )}
    >
      <div
        className={cn(
          'container-page flex items-center justify-between transition-[height] duration-300 ease-out',
          scrolled ? 'h-14' : 'h-16'
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
          {/* Hex icon */}
          <span
            className="grid h-[26px] w-[26px] shrink-0 place-items-center border border-emerald-400/40 bg-emerald-900/15"
            style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}
            aria-hidden="true"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <circle cx="5" cy="5" r="3" stroke="rgba(45,189,116,0.7)" strokeWidth="1.2" fill="none"/>
            </svg>
          </span>
          <span className="font-serif text-[18px] font-bold tracking-[0.01em] text-white">
            Visor <em className="not-italic text-emerald-400">Index</em>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/search"
            className="text-sm font-medium text-white/55 hover:text-white transition-colors"
          >
            Search
          </Link>
          <Link
            href="/compare"
            className="text-sm font-medium text-white/55 hover:text-white transition-colors"
          >
            Compare
          </Link>
          <Link
            href="/negotiate"
            className="text-sm font-medium text-white/55 hover:text-white transition-colors"
          >
            Negotiate
          </Link>
          <Link
            href="/directory"
            className="text-sm font-medium text-white/55 hover:text-white transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-white/55 hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">Dashboard</Button>
                </Link>
                <span className="max-w-[150px] truncate text-sm text-white/45">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-xs text-white/35 transition-colors hover:text-white">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-[#1A7A4A] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#22995E]"
                >
                  Get Access
                </Link>
              </>
            )}
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
