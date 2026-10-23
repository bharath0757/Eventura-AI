import { Sparkles } from 'lucide-react';
import { BRAND } from '@/lib/constants';

/**
 * Application footer — consistent midnight-blue branding.
 */
export function Footer() {
  return (
    <footer className="bg-[#1e2a4a] text-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e8735a]">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold text-white">{BRAND.name}</span>
          </div>

          {/* Tagline */}
          <p className="text-xs text-white/50 text-center">{BRAND.tagline}</p>

          {/* Copyright */}
          <p className="text-xs text-white/40">
            &copy; 2025 {BRAND.name}. Built for demonstration purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
