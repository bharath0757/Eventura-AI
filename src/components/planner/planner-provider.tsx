'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Sparkles, X } from 'lucide-react';
import type { EventCategory } from '@/types';
import { budgetBreakdown, money, planTasks, SAMPLE_BRIEF, type PlanProgress } from '@/lib/planning';
import { PlanPreview } from './plan-preview';

interface PlannerContextValue {
  startPlanning: (category?: EventCategory) => void;
  viewSample: () => void;
  openSavedPlan: () => void;
}
const PlannerContext = createContext<PlannerContextValue | null>(null);

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used within PlannerProvider');
  return context;
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [session, setSession] = useState(0);
  const [progress, setProgress] = useState<PlanProgress>({ completed: [], vendors: {} });

  useEffect(() => { if (dialog.current?.open) heading.current?.focus(); }, [session]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const unlock = () => { document.body.style.overflow = ''; };
    element.addEventListener('close', unlock);
    return () => { element.removeEventListener('close', unlock); unlock(); };
  }, []);

  function startPlanning(category: EventCategory = 'wedding') {
    dialog.current?.close();
    router.push(`/events/new?category=${encodeURIComponent(category)}`);
  }
  function viewSample() {
    setProgress({ completed: [], vendors: {} });
    setSession(value => value + 1);
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
  }
  function downloadPlan() {
    const brief = SAMPLE_BRIEF;
    const content = ['EVENTURA — SAMPLE WEDDING PLAN', brief.name, `${brief.date} · ${brief.location}`, `${brief.guests} guests · ${money(brief.budget)} budget`, `Style: ${brief.style}`, '', 'SUGGESTED BUDGET (ESTIMATES)', ...budgetBreakdown(brief).map(item => `${item.label}: ${money(item.amount)} (${item.percent}%)`), '', 'PLANNING CHECKLIST', ...planTasks(brief).map(task => `[${progress.completed.includes(task.title) ? 'x' : ' '}] ${task.title}: ${task.detail}`), '', 'VENDOR CHECKLIST', ...['Venue & rentals', 'Catering', 'Décor & flowers', 'Photography', 'Entertainment'].map(item => `${item}: ${progress.vendors[item] || 'To research'}`), '', 'This is an illustrative, template-based sample. All amounts are estimates, not vendor quotes. Create your own event for a full, saved plan with date-driven milestones.'].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eventura-sample-plan.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <PlannerContext.Provider value={{ startPlanning, viewSample, openSavedPlan: () => router.push('/events') }}>
    {children}
    <dialog ref={dialog} className="planner-dialog planner-dialog-result" aria-labelledby="planner-heading" onClick={event => {
      if (event.target !== dialog.current) return;
      const rect = dialog.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close();
    }}>
      <div className="planner-dialog-inner">
        <div className="dialog-top"><span className="eyebrow"><Sparkles size={14} /> A LITTLE LOOK INSIDE</span><button className="icon-button" aria-label="Close event planner" onClick={() => dialog.current?.close()}><X size={21} /></button></div>
        <h2 ref={heading} tabIndex={-1} id="planner-heading">Picture the possibilities.</h2>
        <p className="dialog-intro">A clear starting point, with room to make it your own.</p>
        <PlanPreview key={session} onProgressChange={setProgress} />
        <p className="result-note">An illustrative wedding plan. Try the tabs, checklist, and vendor statuses. Sample changes last for this preview; your own events are saved in My events. Rule-based estimates; live AI isn’t connected.</p>
        <div className="form-footer"><button className="text-button" onClick={() => startPlanning()}><ArrowLeft size={15} />Plan my own event</button><button className="button button-dark" onClick={downloadPlan}><Download size={16} />Download sample</button></div>
      </div>
    </dialog>
  </PlannerContext.Provider>;
}
