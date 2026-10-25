import Link from "next/link";
import Image from "next/image";
import { Plus, ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/constants";
export function Header() {
  return <header className="site-header"><nav className="nav container" aria-label="Main navigation">
    <Link href="/" className="brand" aria-label="Eventura AI home"><span className="brand-icon"><Image src={BRAND.logoMark} alt="" width={32} height={32}/></span>eventura<span className="brand-ai">AI</span></Link>
    <div className="nav-links"><Link href="/#how-it-works">How it works</Link><Link href="/events">My events</Link><Link href="/events/new" className="nav-create"><Plus size={16} aria-hidden="true"/> Create event</Link></div>
  </nav></header>;
}
export function Footer() {
  return <footer className="site-footer container"><div><Link href="/" className="footer-brand">eventura AI <ArrowUpRight size={13}/></Link><p>Thoughtful plans. Meaningful moments.</p></div><p>Saved in this browser · No account needed<br/><span>Rule-based plans · Optional Gemini assistance</span></p></footer>;
}
