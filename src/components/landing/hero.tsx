'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { Button } from '@/components/ui';

/**
 * Hero section — prominent brand, tagline, and call-to-action.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#faf7f2] to-white">
      {/* Decorative background shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#e8735a]/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#b8a9d4]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* AI badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#b8a9d4]/15 px-4 py-1.5 text-xs font-semibold text-[#8e7bb5]">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by GenAI
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1e2a4a] leading-[1.1]">
            {BRAND.name}
          </h1>

          {/* Tagline */}
          <p className="mt-4 text-lg sm:text-xl font-medium text-[#e8735a]">
            {BRAND.tagline}
          </p>

          {/* Description */}
          <p className="mt-6 text-base sm:text-lg text-[#1e2a4a]/70 max-w-2xl mx-auto leading-relaxed">
            Plan weddings, birthdays, and community events with AI-driven budgets,
            timelines, vendor checklists, and personalized ideas — all adapting in
            real time as your plans evolve.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="primary" aria-label="Start planning your event">
              Start Planning
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" aria-label="See how Eventura AI works">
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
