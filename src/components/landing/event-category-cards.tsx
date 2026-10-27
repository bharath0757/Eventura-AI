import Image from "next/image";
import { ArrowUpRight, CakeSlice, Heart, Users } from "lucide-react";
import { PlanningAction } from "./planning-action";
import { DeferredPhoto } from "./deferred-photo";

// Match the container widths and three-column gaps in responsive.css.
const CARD_IMAGE_SIZES = [
  "(max-width: 390px) calc(100vw - 36px)",
  "(max-width: 760px) calc(100vw - 48px)",
  "(max-width: 900px) calc((100vw - 82px) / 3)",
  "(max-width: 1150px) calc((100vw - 128px) / 3)",
  "(max-width: 1352px) calc((100vw - 160px) / 3)",
  "398px",
].join(", ");

const OCCASIONS = [
  {
    key: "wedding",
    label: "Weddings",
    icon: Heart,
    tag: "YOUR FOREVER STARTS HERE",
    description: "From the first “yes” to the last dance. Make it unmistakably yours.",
    image: "wedding",
    alt: "Elegant wedding place settings with fresh garden flowers",
  },
  {
    key: "birthday",
    label: "Birthdays",
    icon: CakeSlice,
    tag: "ANOTHER YEAR, MORE MAGIC",
    description: "Big milestones or small get-togethers. Give them a day to remember.",
    image: "birthday",
    alt: "A colourful birthday celebration with balloons and festive decorations",
  },
  {
    key: "community",
    label: "Community gatherings",
    icon: Users,
    tag: "BETTER WHEN WE’RE TOGETHER",
    description: "Bring your people together. We’ll help you bring it all together.",
    image: "community",
    alt: "A thoughtfully decorated gathering space ready to welcome guests",
  },
] as const;

export function EventCategoryCards() {
  return (
    <section id="occasions" className="occasions section-space">
      <div className="container">
        <div className="section-heading occasion-heading">
          <div>
            <span className="eyebrow">A REASON TO CELEBRATE</span>
            <h2>
              Every occasion.
              <br />
              <em>Entirely your own.</em>
            </h2>
          </div>
          <p>
            Life gives you the moments.
            <br />
            Let’s make something wonderful of them.
          </p>
        </div>
        <div className="occasion-grid">
          {OCCASIONS.map(({ key, label, icon: Icon, tag, description, image, alt }) => (
            <PlanningAction
              className="occasion-card"
              key={key}
              category={key}
              aria-label={`Start planning: ${label}`}
            >
              <div className={`occasion-image occasion-image-${key}`}>
                <DeferredPhoto>
                  <Image
                    src={`/images/${image}.jpg`}
                    alt={alt}
                    fill
                    sizes={CARD_IMAGE_SIZES}
                    quality={key === "wedding" ? 50 : 75}
                    fetchPriority="low"
                  />
                </DeferredPhoto>
                <span className="occasion-type">
                  <Icon size={15} /> {label}
                </span>
                <span className="occasion-arrow">
                  <ArrowUpRight size={22} />
                </span>
              </div>
              <div className="occasion-copy">
                <span className="eyebrow">{tag}</span>
                <h3>{label}</h3>
                <p>{description}</p>
              </div>
            </PlanningAction>
          ))}
        </div>
      </div>
    </section>
  );
}
