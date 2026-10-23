'use client';

import { Heart, Cake, Users, ArrowRight } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/constants';
import { Card } from '@/components/ui';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Cake,
  Users,
};

/**
 * Event category selection cards — the first step of the user journey.
 */
export function EventCategoryCards() {
  return (
    <section id="get-started" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e2a4a]">
            What are you planning?
          </h2>
          <p className="mt-3 text-[#1e2a4a]/60 max-w-lg mx-auto">
            Choose your event type and we&apos;ll guide you through every detail.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {EVENT_CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.icon];
            return (
              <Card
                key={cat.key}
                hoverable
                className="group cursor-pointer text-center p-8 border-2 border-transparent hover:border-[#e8735a]/30"
                role="button"
                tabIndex={0}
                aria-label={`Plan a ${cat.label}`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8735a]/10 text-[#e8735a] transition-colors group-hover:bg-[#e8735a] group-hover:text-white">
                  {Icon && <Icon className="h-7 w-7" />}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#1e2a4a]">{cat.label}</h3>
                <p className="mt-2 text-sm text-[#1e2a4a]/60 leading-relaxed">
                  {cat.description}
                </p>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#e8735a] opacity-0 group-hover:opacity-100 transition-opacity">
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
