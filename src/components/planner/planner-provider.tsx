'use client';

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download, Sparkles, X } from 'lucide-react';
import type { EventCategory } from '@/types';
import { budgetBreakdown, CATEGORY_NAMES, isPlannerBrief, money, planTasks, PRIORITIES, SAMPLE_BRIEF, STYLES, type PlannerBrief, type PlanProgress } from '@/lib/planning';
import { PlanPreview } from './plan-preview';

interface PlannerContextValue { startPlanning: (category?: EventCategory) => void; viewSample: () => void; openSavedPlan: () => void }
const PlannerContext = createContext<PlannerContextValue | null>(null);
const STORAGE_KEY = 'eventura:brief:v1';

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used within PlannerProvider');
  return context;
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<'details' | 'style' | 'result'>('details');
  const [brief, setBrief] = useState<PlannerBrief>({ ...SAMPLE_BRIEF, name: '', date: '', location: '', guests: 100, budget: 100000, priorities: [] });
  const [isSample, setIsSample] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(0);
  const [minimumDate, setMinimumDate] = useState('');
  const [progress, setProgress] = useState<PlanProgress>({ completed: [], vendors: {} });

  useEffect(() => { if (dialog.current?.open) heading.current?.focus(); }, [step, session]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const unlock = () => { document.body.style.overflow = ''; };
    element.addEventListener('close', unlock);
    return () => { element.removeEventListener('close', unlock); unlock(); };
  }, []);

  function show() { setError(''); setMinimumDate(localDate()); setProgress({ completed: [], vendors: {} }); setSession(n => n + 1); dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }
  function startPlanning(category: EventCategory = 'wedding') { setStep('details'); setIsSample(false); setSaved(false); setBrief({ category, name: '', date: '', location: '', guests: 100, budget: 100000, style: STYLES[0], priorities: [] }); show(); }
  function viewSample() { setBrief({ ...SAMPLE_BRIEF }); setStep('result'); setIsSample(true); setSaved(false); show(); }
  function openSavedPlan() {
    try { const data = localStorage.getItem(STORAGE_KEY); if (data) { const stored: unknown = JSON.parse(data); if (isPlannerBrief(stored)) { setBrief(stored); setStep('result'); setIsSample(false); setSaved(true); show(); return; } } } catch { /* Storage can be unavailable in private browsing. */ }
    startPlanning();
  }
  function update<K extends keyof PlannerBrief>(key: K, value: PlannerBrief[K]) { setBrief(current => ({ ...current, [key]: value })); }
  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = { ...brief, name: brief.name.trim(), location: brief.location.trim() };
    if (!isPlannerBrief(cleaned)) { setError('Please add an event name, location, date, and valid guest count and budget.'); return; }
    if (cleaned.date < localDate()) { setError('Choose today or a future date for your event.'); return; }
    setBrief(cleaned); setError(''); setStep('style');
  }
  function createPlan() {
    setProgress({ completed: [], vendors: {} });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(brief)); setSaved(true); } catch { setSaved(false); }
    setStep('result');
  }
  function downloadPlan() {
    const content = ['EVENTURA — YOUR STARTER PLAN', brief.name, `${CATEGORY_NAMES[brief.category]} · ${brief.date} · ${brief.location}`, `${brief.guests} guests · ${money(brief.budget)} budget`, `Style: ${brief.style}`, `Priorities: ${brief.priorities.join(', ') || 'A balanced celebration'}`, '', 'SUGGESTED BUDGET (ESTIMATES)', ...budgetBreakdown(brief).map(item => `${item.label}: ${money(item.amount)} (${item.percent}%)`), '', 'PLANNING CHECKLIST', ...planTasks(brief).map(task => `[${progress.completed.includes(task.title) ? 'x' : ' '}] ${task.title}: ${task.detail}`), '', 'VENDOR CHECKLIST', ...['Venue & rentals', 'Catering', 'Décor & flowers', 'Photography', 'Entertainment'].map(item => `${item}: ${progress.vendors[item] || 'To research'}`), '', 'CONTINGENCY', 'Keep the just-in-case fund available. Confirm cancellation terms and have an indoor alternative for outdoor events.', '', 'This is a template-based demonstration, not a live AI response. All amounts are estimates, not vendor quotes. This download includes your current checklist and vendor statuses.'].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'eventura-event-plan.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <PlannerContext.Provider value={{ startPlanning, viewSample, openSavedPlan }}>
    {children}
    <dialog ref={dialog} className={`planner-dialog ${step === 'result' ? 'planner-dialog-result' : ''}`} aria-labelledby="planner-heading" onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close(); } }}>
      <div className="planner-dialog-inner">
        <div className="dialog-top"><span className="eyebrow"><Sparkles size={14} /> {isSample ? 'A LITTLE LOOK INSIDE' : 'LET’S MAKE IT HAPPEN'}</span><button className="icon-button" aria-label="Close event planner" onClick={() => dialog.current?.close()}><X size={21} /></button></div>
        <h2 ref={heading} tabIndex={-1} id="planner-heading">{step === 'details' ? 'A good plan starts with you.' : step === 'style' ? 'Let’s make it feel like you.' : isSample ? 'Picture the possibilities.' : 'Your celebration starts here.'}</h2>
        <p className="dialog-intro">{step === 'details' ? 'Just the essentials. We’ll give the little details a home.' : step === 'style' ? 'A little personality goes a long way. What matters most to you?' : 'A clear starting point, with room to make it your own.'}</p>
        {step !== 'result' && <div className="form-progress"><span className="active">01 <span>The essentials</span></span><i /><span className={step === 'style' ? 'active' : ''}>02 <span>Your kind of celebration</span></span></div>}
        {step === 'details' ? <form onSubmit={submitDetails}>
          <div className="planner-fields">
            <label className="field-full">What are we celebrating?<select value={brief.category} onChange={e => update('category', e.target.value as EventCategory)}>{Object.entries(CATEGORY_NAMES).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
            <label className="field-full">Give your event a name<input required maxLength={100} value={brief.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Ananya & Arjun’s big day" autoComplete="off" /></label>
            <label>When’s the occasion?<input required type="date" min={minimumDate} value={brief.date} onChange={e => update('date', e.target.value)} /></label>
            <label>Where’s it happening?<input required maxLength={100} value={brief.location} onChange={e => update('location', e.target.value)} placeholder="City or neighbourhood" autoComplete="address-level2" /></label>
            <label>How many guests?<input required type="number" min={1} max={100000} step={1} value={brief.guests || ''} onChange={e => update('guests', Number(e.target.value))} /></label>
            <label>Your total budget (₹)<input required type="number" min={1000} max={100000000} step={1} value={brief.budget || ''} onChange={e => update('budget', Number(e.target.value))} /></label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-footer"><span>Step 1 of 2 · No sign-up needed</span><button type="submit" className="button button-dark">Make it personal <ArrowRight size={16} /></button></div>
        </form> : step === 'style' ? <div>
          <fieldset className="preference-group"><legend>What’s the mood?</legend><div className="style-options">{STYLES.map(style => <button type="button" key={style} className={brief.style === style ? 'selected' : ''} aria-pressed={brief.style === style} onClick={() => update('style', style)}>{style}<span>{brief.style === style ? <Check size={15} /> : <span className="empty-circle" />}</span></button>)}</div></fieldset>
          <fieldset className="preference-group"><legend>Your priorities <small>Pick any that matter to you</small></legend><div className="priority-options">{PRIORITIES.map(priority => <button type="button" key={priority} aria-pressed={brief.priorities.includes(priority)} onClick={() => update('priorities', brief.priorities.includes(priority) ? brief.priorities.filter(p => p !== priority) : [...brief.priorities, priority])}>{brief.priorities.includes(priority) && <Check size={13} />}{priority}</button>)}</div></fieldset>
          <div className="form-info"><Sparkles size={18} /><p>Your starter plan uses thoughtful templates tailored to these details. Live AI generation isn’t connected yet.</p></div>
          <div className="form-footer"><button className="text-button" onClick={() => setStep('details')}><ArrowLeft size={15} /> Go back</button><button className="button button-coral" onClick={createPlan}>Create my starter plan <ArrowUpRight size={16} /></button></div>
        </div> : <div>
          <PlanPreview brief={brief} key={session} onProgressChange={setProgress} />
          <p className="result-note">{isSample ? 'An illustrative wedding plan. Try the tabs, checklist, and vendor statuses.' : saved ? 'Your event brief is saved on this device. Checklist and vendor changes are session-only.' : 'Your plan is ready for this session. Download a copy to keep it.'} Template-based demo; live AI generation isn’t connected.</p>
          <div className="form-footer"><button className="text-button" onClick={() => isSample ? startPlanning() : setStep('details')}><ArrowLeft size={15} />{isSample ? 'Plan my own event' : 'Edit my details'}</button><button className="button button-dark" onClick={downloadPlan}><Download size={16} />Download plan</button></div>
        </div>}
      </div>
    </dialog>
  </PlannerContext.Provider>;
}
