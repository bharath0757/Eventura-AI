import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CirclePlay,
  Flower2,
  Heart,
  Sparkles,
} from "lucide-react";
import { PlanningAction } from "./planning-action";

export function Hero() {
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow hero-eyebrow">
          <span className="status-dot" /> GENAI EVENT PLANNING. MADE PERSONAL.
        </div>
        <h1 id="hero-title">
          Big moments.
          <br />
          Little details.
          <br />
          <em>Beautifully planned.</em>
        </h1>
        <p className="hero-description">
          Plan weddings, birthdays, and community events with budgets, timelines, vendor checklists
          and personalized ideas. Start with a clear plan, then request Gemini guidance tailored to
          your occasion.
        </p>
        <div className="hero-actions">
          <PlanningAction className="button button-coral">
            Start planning your event <ArrowUpRight size={18} />
          </PlanningAction>
          <PlanningAction className="sample-link" action="sample">
            <CirclePlay size={20} strokeWidth={1.5} /> Explore a sample plan
          </PlanningAction>
        </div>
        <div className="hero-reassurance">
          <span>
            <Check size={14} /> No sign-up needed
          </span>
          <span>
            <Check size={14} /> Your budget, your rules
          </span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-image-wrap">
          <Image
            src="/images/wedding.jpg"
            alt="A sunlit wedding table with garden flowers, delicate glassware, and carefully arranged place settings"
            fill
            sizes="(max-width: 760px) calc(100vw - 64px), (max-width: 1100px) 45vw, 520px"
            loading="eager"
            fetchPriority="high"
            className="hero-image"
          />
          <div className="image-shade" />
          <span className="photo-label">
            <span className="photo-label-dot" /> MADE FOR MOMENTS LIKE THIS
          </span>
          <div className="photo-caption">
            A day to remember.
            <br />
            <em>A plan to make it happen.</em>
          </div>
          <span className="hero-flower" aria-hidden="true">
            <Flower2 size={59} strokeWidth={1} />
          </span>
        </div>
        <div className="floating-note">
          <span className="note-icon">
            <Sparkles size={17} />
          </span>
          <div>
            A little inspiration.<strong>A whole lot of possibility.</strong>
          </div>
          <span className="note-sparkle" aria-hidden="true">
            ✧
          </span>
        </div>
        <PlanningAction
          className="hero-plan-card"
          action="sample"
          aria-label="Explore the sample wedding plan"
        >
          <div className="mini-plan-top">
            <span className="mini-heart">
              <Heart size={17} />
            </span>
            <div>
              <strong>The big day, in the making</strong>
              <span>Wedding · Sample plan</span>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <div className="mini-plan-stats">
            <div>
              <span>ESTIMATED BUDGET</span>
              <strong>₹5,00,000</strong>
            </div>
            <div>
              <span>GUEST LIST</span>
              <strong>
                150 <small>lovely people</small>
              </strong>
            </div>
          </div>
          <div className="mini-budget-bar">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="mini-plan-footer">
            <CheckCheck size={15} /> Big picture. Every little detail.
            <span>
              Take a look <ArrowRight size={12} />
            </span>
          </div>
        </PlanningAction>
        <span className="handwritten-note" aria-hidden="true">
          You bring the occasion.
          <br />
          We’ll bring the order. <span>↗</span>
        </span>
      </div>
    </section>
  );
}
