import { ArrowUpRight, ClipboardPenLine, PartyPopper, SlidersHorizontal } from 'lucide-react';

const STEPS = [
  { number: '01', title: 'Tell us what you’re dreaming of.', description: 'Your occasion, your people, your budget. A few details are all it takes to get started.', icon: ClipboardPenLine },
  { number: '02', title: 'Give every detail a home.', description: 'Explore a starter budget, a practical timeline, and a vendor checklist in one clear plan.', icon: SlidersHorizontal },
  { number: '03', title: 'Make room for the good part.', description: 'Fine-tune the details, tick things off, and spend more time looking forward to your day.', icon: PartyPopper },
];

export function HowItWorks() {
  return <section id="how-it-works" className="how-section section-space container">
    <div className="section-heading centered"><span className="eyebrow">FROM “WHAT IF” TO “IT’S HAPPENING”</span><h2>A little input.<em> A lovely beginning.</em></h2><p>There’s a simpler way to get your plans off the ground.</p></div>
    <div className="steps-grid">{STEPS.map(({ number, title, description, icon: Icon }) => <article className="step" key={number}><div className="step-top"><span className="step-icon"><Icon size={24} strokeWidth={1.5} /></span><span className="step-number">{number}</span><ArrowUpRight className="step-arrow" size={20} /></div><h3>{title}</h3><p>{description}</p></article>)}</div>
  </section>;
}
