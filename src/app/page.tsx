import Link from "next/link";
import { ArrowUpRight, ArrowRight, Heart, Cake, Users, Check, CalendarDays, ShieldCheck, Sparkles, Wallet, ListChecks } from "lucide-react";
import { ActionLink } from "@/components/ui";
const eventTypes=[
  {key:"wedding",name:"Weddings",subtitle:"For your forever kind of day.",icon:Heart,className:"peach",detail:"Ceremony, catering & all the little details"},
  {key:"birthday",name:"Birthdays",subtitle:"Another year. A little more magic.",icon:Cake,className:"lavender",detail:"Cake, activities & moments worth celebrating"},
  {key:"community",name:"Community events",subtitle:"Good things happen together.",icon:Users,className:"sage",detail:"People, purpose & a plan to bring them together"}
];
export default function Home() {
  return <div>
    <section className="hero container">
      <div className="hero-copy"><p className="eyebrow"><span className="tiny-star">✦</span> A little structure. A lot of possibility.</p>
        <h1>Big moments.<br/>Thoughtfully <em>planned.</em></h1>
        <p className="hero-description">Your vision. Your budget. Your perfect event.<br/>Turn a beautiful idea into a plan you can actually follow.</p>
        <div className="hero-actions"><ActionLink href="/events/new">Let’s plan your event</ActionLink><Link href="/events" className="text-link">Open my events <ArrowUpRight size={16}/></Link></div>
        <div className="hero-benefits"><span><Check size={14}/> No sign-up</span><span><Check size={14}/> No API key</span><span><Check size={14}/> Your budget, respected</span></div>
      </div>
      <div className="hero-art" aria-label="Illustration of a personalized event plan">
        <span className="art-orbit orbit-one"/><span className="art-orbit orbit-two"/><span className="art-star star-one">✦</span><span className="art-star star-two">✳</span>
        <div className="plan-preview"><div className="preview-top"><span className="preview-icon"><Sparkles size={21}/></span><span className="eyebrow">A plan with possibilities</span><span className="preview-dots">•••</span></div>
          <p className="preview-kicker">YOUR NEXT BIG MOMENT</p><h2>Less juggling.<br/>More celebrating.</h2>
          <div className="preview-date"><CalendarDays size={15}/> Built around your date & your people</div>
          <div className="preview-budget"><div><span>Every rupee has a purpose</span><strong>A budget that adds up.</strong></div><div className="mini-donut"><span>100<small>%</small></span></div></div>
          <div className="preview-segments"><span/><span/><span/><span/></div><div className="preview-legend"><span>Essentials</span><span>Thoughtful extras</span><span>Reserve</span></div>
          <div className="preview-task"><span className="preview-check"><Check size={12}/></span>A clear timeline for the day<span className="preview-tag">Organized</span></div>
          <div className="preview-task"><span className="preview-check"><Check size={12}/></span>Ideas that feel like you<span className="preview-tag purple">Personal</span></div>
          <p className="preview-caption">An illustration of what your starter plan brings together</p>
        </div>
        <div className="floating-note"><span>✦</span><div>Make room for the moment.<small>We’ll help with the plan.</small></div></div>
      </div>
    </section>
    <div className="trust-strip"><div className="container"><span><Wallet size={18}/> Budgets in INR</span><span><ListChecks size={18}/> Practical checklists</span><span><CalendarDays size={18}/> Date-driven timelines</span><span><ShieldCheck size={18}/> Saved in your browser</span></div></div>
    <section className="section container" id="event-types"><div className="section-heading"><div><p className="eyebrow">Every occasion has a story</p><h2>What are we celebrating?</h2></div><p className="muted">Start with the occasion.<br/>We’ll help you make it your own.</p></div>
      <div className="category-grid">{eventTypes.map(({key,name,subtitle,icon:Icon,className,detail})=><Link key={key} href={`/events/new?category=${key}`} className={`category-card ${className}`}><div className="category-card-top"><span className="category-icon"><Icon size={26} strokeWidth={1.4}/></span><ArrowUpRight size={23}/></div><div><h3>{name}</h3><p>{subtitle}</p><small>{detail}</small></div><span className="category-cta">Start planning <ArrowRight size={16}/></span></Link>)}</div>
    </section>
    <section className="how-section container" id="how-it-works"><div><p className="eyebrow">From “what if” to “all set”</p><h2>A good plan starts<br/>with a few details.</h2><p className="muted">No complicated spreadsheets. Just a clear starting point you can come back to.</p></div><ol className="how-steps"><li><span>01</span><div><h3>Tell us about your event</h3><p>Your date, your people, your style and what matters most.</p></div></li><li><span>02</span><div><h3>Find your starting point</h3><p>Get estimated allocations, a timeline, checklists and tailored ideas.</p></div></li><li><span>03</span><div><h3>Make it happen, one task at a time</h3><p>Save your progress and return to your plan in this browser.</p></div></li></ol></section>
    <section className="closing container"><Sparkles size={28}/><h2>Your next great memory<br/>starts with a plan.</h2><ActionLink href="/events/new">Create your event</ActionLink><p>Transparent, rule-based starter plans. Live AI recommendations are a future phase.</p></section>
  </div>;
}
