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
        'sticky top-0 z-50 w-full transition-all duration-500 ease-out',
        scrolled
          ? 'border-b border-white/[0.08] bg-[#0a1c2a]/90 shadow-[0_4px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl'
          : 'border-b border-transparent bg-[#0a1c2a]'
      )}
    >
      <div
        className={cn(
          'container-page flex items-center justify-between transition-[height] duration-500 ease-out',
          scrolled ? 'h-[52px]' : 'h-[60px]'
        )}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#1A7A4A] shadow-[0_0_12px_rgba(26,122,74,0.2)] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(45,189,116,0.3)]">
            <svg width="16" height="18" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6.5 7L10 14.5L13.5 7" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-white">
            Visor<span className="ml-[0.1em] font-bold text-[#2DBD74]">Index</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-[2px] lg:flex">
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
              className="relative px-3 py-1.5 text-[12.5px] font-medium tracking-[0.01em] text-white/40 transition-colors duration-200 hover:text-white/85"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-4 lg:flex">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-[12.5px] text-white/50 hover:bg-white/[0.06] hover:text-white">Dashboard</Button>
                </Link>
                <span className="max-w-[120px] truncate text-[12px] text-white/30">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" className="text-[12.5px] text-white/40 hover:bg-white/[0.06] hover:text-white" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-[12.5px] font-medium text-white/40 transition-colors duration-200 hover:text-white/80">
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-[#1A7A4A] px-5 py-[7px] text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#1f8f55]"
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
