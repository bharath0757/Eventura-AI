import {
  DollarSign,
  CalendarCheck,
  ClipboardList,
  Lightbulb,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui';

const FEATURES = [
  {
    icon: DollarSign,
    title: 'Smart Budget Breakdown',
    description:
      'AI-generated budget allocations with real-time tracking. Every cost is clearly labelled as an estimate.',
    color: 'bg-[#2d9f6f]/10 text-[#2d9f6f]',
  },
  {
    icon: CalendarCheck,
    title: 'Planning Timeline',
    description:
      'Deadline-driven task lists so nothing slips through the cracks, from first booking to final check.',
    color: 'bg-[#1e2a4a]/10 text-[#1e2a4a]',
  },
  {
    icon: ClipboardList,
    title: 'Vendor Checklist',
    description:
      'Organised vendor categories with status tracking. Research, contact, book, and confirm — all in one place.',
    color: 'bg-[#e8735a]/10 text-[#e8735a]',
  },
  {
    icon: Lightbulb,
    title: 'Personalised Ideas',
    description:
      'Theme suggestions, activity ideas, and creative inspiration tailored to your event style and preferences.',
    color: 'bg-[#b8a9d4]/15 text-[#8e7bb5]',
  },
  {
    icon: ShieldCheck,
    title: 'Risk & Contingency',
    description:
      'Proactive risk assessment with mitigation strategies so you can plan with confidence.',
    color: 'bg-[#2d9f6f]/10 text-[#2d9f6f]',
  },
  {
    icon: RefreshCw,
    title: 'Adaptive Planning',
    description:
      'Change your budget, guest count, or priorities and see how the entire plan adapts instantly.',
    color: 'bg-[#e8735a]/10 text-[#e8735a]',
  },
] as const;

/**
 * Features grid — showcases the six core product capabilities.
 */
export function Features() {
  return (
    <section id="features" className="bg-[#faf7f2] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1e2a4a]">
            Everything you need to plan with confidence
          </h2>
          <p className="mt-3 text-[#1e2a4a]/60 max-w-lg mx-auto">
            Eventura AI combines intelligent automation with your creative vision.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="flex flex-col gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${f.color}`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1e2a4a]">{f.title}</h3>
              <p className="text-sm text-[#1e2a4a]/60 leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
