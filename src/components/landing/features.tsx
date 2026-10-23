'use client';

import { ArrowUpRight, CalendarDays, Check, Flower2, SlidersHorizontal, Wallet } from 'lucide-react';
import { PlanPreview } from '@/components/planner/plan-preview';
import { usePlanner } from '@/components/planner/planner-provider';

const BENEFITS = [
  { icon: Wallet, title: 'A budget with breathing room.', description: 'Thoughtful allocations, clear estimates, and a little set aside for the unexpected.' },
  { icon: CalendarDays, title: 'Every to-do, a little less daunting.', description: 'A practical checklist and a home for every vendor, so the details stay together.' },
  { icon: SlidersHorizontal, title: 'Your plans can change. That’s okay.', description: 'Revisit your details, adjust your priorities, and make the plan feel more like you.' },
];

export function Features() {
  const { startPlanning } = usePlanner();
  return <section id="features" className="features-section section-space"><div className="container features-grid">
    <div className="features-copy"><span className="eyebrow">LESS IN YOUR HEAD. MORE IN YOUR PLAN.</span><h2>The big picture.<br /><em>And all the little things.</em></h2><p className="section-description">Consider this your calm corner of the planning process. One thoughtful space for everything that goes into your day.</p><div className="benefit-list">{BENEFITS.map(({ icon: Icon, title, description }) => <div className="benefit" key={title}><span className="benefit-icon"><Icon size={21} strokeWidth={1.5} /></span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div><button className="underlined-link" onClick={() => startPlanning()}>Find your planning rhythm <ArrowUpRight size={17} /></button></div>
    <div className="preview-stage"><div className="preview-stage-label"><span className="status-dot" /> A LITTLE PREVIEW OF YOUR PEACE OF MIND <span aria-hidden="true">↘</span></div><PlanPreview compact /><p className="try-preview">Go on, try the tabs. This space is yours to explore.</p></div>
  </div></section>;
}

const QUESTIONS = [
  { question: 'What can I plan with Eventura?', answer: 'Start with a wedding, birthday, or community gathering. Add your date, location, guest count, and budget, then choose a style and priorities to create a starter plan.' },
  { question: 'Do I need an account to get started?', answer: 'No account is needed. Your latest event brief is saved in this browser on this device when storage is available. Use “Your plan” in the navigation to return to it, or download a text copy. Checklist and vendor-status changes last only for the current session.' },
  { question: 'Are these real vendor prices or AI-generated plans?', answer: 'This project currently uses interactive, template-based demo plans. Budget amounts are suggested estimates, not live vendor quotes. Live AI generation and vendor bookings are not connected.' },
  { question: 'Can I change my budget or event details later?', answer: 'Yes. Open your plan, choose “Edit my details”, and update your event information. Creating the plan again recalculates the suggested budget based on your occasion and selected priorities. It also resets your session checklist.' },
];

export function QuestionsAndCTA() {
  const { startPlanning } = usePlanner();
  return <>
    <section id="questions" className="questions-section container section-space"><div><span className="eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</span><h2>Good questions.<br /><em>Simple answers.</em></h2><p>One less thing to figure out.</p></div><div className="faq-list">{QUESTIONS.map(({ question, answer }) => <details key={question}><summary>{question}<span className="faq-plus" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <section className="closing-section container"><div className="closing-card"><span className="closing-flower" aria-hidden="true"><Flower2 size={135} strokeWidth={0.8} /></span><div><span className="eyebrow">THE BEST PART IS STILL TO COME</span><h2>Here’s to your next<br /><em>“remember when.”</em></h2><p>Start with an idea. Let’s give it a plan.</p></div><div className="closing-action"><button className="button button-coral" onClick={() => startPlanning()}>Let’s make it happen <ArrowUpRight size={19} /></button><span><Check size={13} /> No account. Just possibilities.</span></div></div></section>
  </>;
}
