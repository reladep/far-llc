'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

const allNavLinks = [
  { label: 'Search', href: '/search' },
  { label: 'Compare', href: '/compare' },
  { label: 'Match', href: '/match' },
  { label: 'Negotiate', href: '/negotiate' },
  { label: 'Guide', href: '/guide' },
  { label: 'Directory', href: '/directory' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navLinks = user ? allNavLinks.filter(l => l.href !== '/pricing') : allNavLinks;

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const overlay = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 z-[9999] flex h-full w-72 flex-col bg-[#0a1c2a] text-white shadow-xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-white/60">Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block w-full rounded-md bg-gradient-to-b from-[#1f8f55] to-[#1A7A4A] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_1px_8px_rgba(26,122,74,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:from-[#22995E] hover:to-[#1f8f55] hover:shadow-[0_2px_16px_rgba(45,189,116,0.3)]"
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  setOpen(false);
                  window.location.href = '/';
                }}
                className="mt-3 block w-full rounded-md border border-white/15 px-4 py-3 text-center text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="block w-full rounded-md bg-gradient-to-b from-[#1f8f55] to-[#1A7A4A] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_1px_8px_rgba(26,122,74,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:from-[#22995E] hover:to-[#1f8f55] hover:shadow-[0_2px_16px_rgba(45,189,116,0.3)]"
              >
                Get Access
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="mt-3 block w-full rounded-md border border-white/15 px-4 py-3 text-center text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {/* Portal to body so overlay escapes all stacking contexts */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
