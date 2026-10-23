import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/landing/hero';
import { EventCategoryCards } from '@/components/landing/event-category-cards';
import { Features, QuestionsAndCTA } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PlannerProvider } from '@/components/planner/planner-provider';
import { CalendarCheck, HeartHandshake, Leaf, Wallet } from 'lucide-react';

export default function HomePage() {
  return <div className="landing-site"><PlannerProvider>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <Navbar />
    <main id="main-content">
      <Hero />
      <div className="promise-strip"><div className="container"><span>A little more organised.<br /><strong>A lot more you.</strong></span><span><Wallet size={20} strokeWidth={1.4} /> Thoughtful budgets</span><span><CalendarCheck size={20} strokeWidth={1.4} /> Every detail, in place</span><span><HeartHandshake size={20} strokeWidth={1.4} /> Made around you</span><span><Leaf size={20} strokeWidth={1.4} /> Room to enjoy it</span></div></div>
      <EventCategoryCards /><Features /><HowItWorks /><QuestionsAndCTA />
    </main><Footer />
  </PlannerProvider></div>;
}
