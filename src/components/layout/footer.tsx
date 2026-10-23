import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';

export function Footer() {
  return <footer className="site-footer container">
    <div className="footer-top"><Link href="/" className="brand" aria-label="Eventura AI home"><span className="brand-mark"><Sparkles size={22} /></span><span>eventura<span className="brand-ai">AI</span></span></Link><p>For the moments that bring us together.</p><nav aria-label="Footer navigation"><a href="#occasions">Occasions</a><a href="#how-it-works">How it works</a><a href="#questions">FAQs</a></nav></div>
    <div className="footer-bottom"><span>© 2026 Eventura AI. A thoughtfully made project.</span><span>Made for a little more joy <Heart size={12} /></span><a href="https://unsplash.com" target="_blank" rel="noreferrer">Photography via Unsplash ↗</a></div>
  </footer>;
}
