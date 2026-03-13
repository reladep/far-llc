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
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md shadow-[0_0_12px_rgba(45,189,116,0.15)] transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(45,189,116,0.3)]">
            <img
              src="/visor_logo.png"
              alt="Visor Index"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-white">
            Visor{' '}
            <span className="text-[#2DBD74]">Index</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 lg:flex">
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
              className="rounded-md px-3.5 py-1.5 text-[13.5px] font-medium tracking-[0.01em] text-white/50 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/90"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth + Mobile Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-5 lg:flex">
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
                <Link href="/auth/login" className="text-[13.5px] font-medium text-white/45 transition-colors duration-200 hover:text-white/80">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-[#1A7A4A] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_0_12px_rgba(45,189,116,0.12)] transition-all duration-200 hover:bg-[#22995E] hover:shadow-[0_0_16px_rgba(45,189,116,0.25)]"
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
