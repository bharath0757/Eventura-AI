'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import { usePlanner } from '@/components/planner/planner-provider';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { startPlanning, openSavedPlan } = usePlanner();
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="Eventura AI home"><span className="brand-mark"><Sparkles size={23} strokeWidth={1.8} /></span><span>eventura<span className="brand-ai">AI</span></span></Link>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#occasions">Occasions</a><a href="#features">The experience</a><a href="#how-it-works">How it works</a></nav>
        <div className="nav-actions">
          <button className="text-button saved-plan-button" onClick={openSavedPlan}>Your plan</button>
          <button className="button button-dark nav-cta" onClick={() => startPlanning()}>Let’s plan something <ArrowUpRight size={16} /></button>
          <button className="icon-button mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {mobileOpen && <nav className="mobile-nav container" id="mobile-navigation" aria-label="Mobile navigation">
        <a href="#occasions" onClick={() => setMobileOpen(false)}>Occasions</a><a href="#features" onClick={() => setMobileOpen(false)}>The experience</a><a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
        <button onClick={() => { setMobileOpen(false); openSavedPlan(); }}>Your plan</button><button className="button button-dark" onClick={() => { setMobileOpen(false); startPlanning(); }}>Start planning <ArrowUpRight size={16} /></button>
      </nav>}
    </header>
  );
}
