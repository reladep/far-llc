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
        'sticky top-0 z-50 w-full backdrop-blur transition-all duration-300 ease-out',
        scrolled
          ? 'border-b border-white/[0.06] bg-[#0a1c2a]/95 shadow-[0_1px_24px_-6px_rgba(0,0,0,0.5)]'
          : 'border-b border-transparent bg-[#0a1c2a]/60'
      )}
    >
      <div
        className={cn(
          'container-page flex items-center justify-between transition-[height] duration-300 ease-out',
          scrolled ? 'h-[56px]' : 'h-[64px]'
        )}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#1A7A4A] to-[#16a34a] shadow-[0_0_16px_rgba(26,122,74,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(45,189,116,0.35)]">
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Shield outline */}
              <path d="M10 1L1 4.5V10C1 15.5 4.8 19.7 10 21C15.2 19.7 19 15.5 19 10V4.5L10 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.35" />
              {/* Inner shield */}
              <path d="M10 3.5L3 6.2V10.5C3 14.8 6.1 18.2 10 19.2C13.9 18.2 17 14.8 17 10.5V6.2L10 3.5Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.2" />
              {/* Prominent V */}
              <path d="M6.5 7L10 14.5L13.5 7" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-white">
            Visor<span className="ml-[0.12em] font-bold text-[#2DBD74]">Index</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {[
            { href: '/search', label: 'Search' },
            { href: '/compare', label: 'Compare' },
            { href: '/match', label: 'Match' },
            { href: '/negotiate', label: 'Negotiate' },
            { href: '/guide', label: 'Guide' },
            { href: '/directory', label: 'Directory' },
            { href: '/pricing', label: 'Pricing' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-md px-3 py-1.5 text-[13px] font-medium tracking-[0.02em] text-white/45 transition-all duration-200 hover:text-white/90 after:absolute after:bottom-0 after:left-1/2 after:h-[1.5px] after:w-0 after:-translate-x-1/2 after:bg-[#2DBD74] after:transition-all after:duration-300 hover:after:w-3/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-5 lg:flex">
            <div className="mr-1 h-4 w-px bg-white/[0.08]" />
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">Dashboard</Button>
                </Link>
                <span className="max-w-[150px] truncate text-[13.5px] text-white/45">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-[13px] font-medium tracking-[0.02em] text-white/40 transition-colors duration-200 hover:text-white/80">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-gradient-to-b from-[#1f8f55] to-[#1A7A4A] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_1px_8px_rgba(26,122,74,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:from-[#22995E] hover:to-[#1f8f55] hover:shadow-[0_2px_16px_rgba(45,189,116,0.3)]"
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
