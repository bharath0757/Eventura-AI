import Link from "next/link";
import { Sparkles, Plus, ArrowUpRight } from "lucide-react";
export function Header() {
  return <header className="site-header"><nav className="nav container" aria-label="Main navigation">
    <Link href="/" className="brand"><span className="brand-icon"><Sparkles size={20} aria-hidden="true"/></span>eventura<span className="brand-ai">AI</span></Link>
    <div className="nav-links"><Link href="/#how-it-works">How it works</Link><Link href="/events">My events</Link><Link href="/events/new" className="nav-create"><Plus size={16} aria-hidden="true"/> Create event</Link></div>
  </nav></header>;
}
export function Footer() {
  return <footer className="site-footer container"><div><Link href="/" className="footer-brand">eventura AI <ArrowUpRight size={13}/></Link><p>Thoughtful plans. Meaningful moments.</p></div><p>Saved in this browser · No account needed<br/><span>Rule-based starter plans · Phase 2</span></p></footer>;
}
