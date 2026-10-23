import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Hero, EventCategoryCards, Features, HowItWorks } from '@/components/landing';

/**
 * Eventura AI — Landing page
 *
 * Displays the brand, event category selection, feature highlights,
 * and the how-it-works walkthrough.
 */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <EventCategoryCards />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  );
}
