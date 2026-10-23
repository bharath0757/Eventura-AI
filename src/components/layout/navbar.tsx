'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Application header — midnight-blue navbar with the Eventura AI brand.
 */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#1e2a4a] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Eventura AI Home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8735a] transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">{BRAND.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="text-white/80 transition-colors hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="text-white/80 transition-colors hover:text-white">
            How It Works
          </a>
          <a
            href="#get-started"
            className="rounded-lg bg-[#e8735a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#c95a42]"
          >
            Start Planning
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      <nav
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 bg-[#1e2a4a] border-t border-white/10',
          mobileOpen ? 'max-h-48 py-3' : 'max-h-0 py-0',
        )}
      >
        <div className="flex flex-col gap-2 px-4">
          <a
            href="#features"
            className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#get-started"
            className="rounded-lg bg-[#e8735a] px-3 py-2 text-sm font-semibold text-white text-center transition-colors hover:bg-[#c95a42]"
          >
            Start Planning
          </a>
        </div>
      </nav>
    </header>
  );
}
