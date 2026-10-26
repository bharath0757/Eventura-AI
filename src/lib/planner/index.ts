import type {
  BudgetItem,
  Category,
  EventBrief,
  EventPlan,
  EventRecord,
  PersonalizedIdea,
  RiskRecommendation,
} from "@/types";
import { creationSchema, recordSchema } from "@/lib/validation/schemas";
import { todayLocal } from "@/lib/dates";
import { budgetProfiles } from "./profiles";
import { buildTimeline, buildVendors } from "./tasks";
export function allocateBudget(category: Category, total: number): BudgetItem[] {
  if (!Number.isSafeInteger(total) || total < 1000 || total > 100_000_000)
    throw new Error("Invalid total budget.");
  const profile = budgetProfiles[category];
  if (profile.reduce((s, i) => s + i.percentage, 0) !== 100)
    throw new Error("Invalid allocation profile.");
  const rows = profile.map((item, index) => ({
    item,
    index,
    amount: Math.floor((total * item.percentage) / 100),
    remainder: (total * item.percentage) % 100,
  }));
  const remaining = total - rows.reduce((s, r) => s + r.amount, 0);
  // Largest remainder; profile order breaks ties, using only exact integer products.
  const ranked = [...rows].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < remaining; i++) ranked[i].amount++;
  const result = rows.map(({ item, amount }) => ({
    id: `budget-${item.key}`,
    category: item.key,
    label: item.label,
    percentage: item.percentage,
    amount,
    contingency: !!item.contingency,
  }));
  if (result.reduce((s, i) => s + i.amount, 0) !== total)
    throw new Error("Budget allocation failed.");
  return result;
}
function ideasFor(b: EventBrief): PersonalizedIdea[] {
  const theme = b.details.category === "birthday" ? b.details.celebrationStyle : b.details.theme;
  const ideas: PersonalizedIdea[] = [
    {
      id: "idea-theme",
      title: "Bring your theme to life",
      category: "Atmosphere",
      description: `Use “${theme}” as the thread for invitations, signage and a few focal details. Reuse elements between spaces.`,
      relevance: `Builds on your chosen style for ${b.name}.`,
    },
    {
      id: "idea-guests",
      title: b.guests > 100 ? "Create smaller gathering zones" : "Make room for shared moments",
      category: "Guest experience",
      description:
        b.guests > 100
          ? `For ${b.guests} guests, use clear signs and smaller seating or activity zones so people can find their way.`
          : `With ${b.guests} guests, a shared welcome activity can help everyone feel included.`,
      relevance: "Adapts the experience to your expected attendance.",
    },
    {
      id: "idea-budget",
      title:
        b.budget / b.guests < 500 ? "Keep the format focused" : "Compare a few thoughtful upgrades",
      category: "Budget",
      description:
        b.budget / b.guests < 500
          ? "Choose a simple venue or shorter format and focus spending on essentials. Request quotes to check what is feasible."
          : "Compare written quotes for your highest priorities before adding extras. Keep the contingency reserve separate.",
      relevance: "Uses the budget per guest as a planning signal, without promising market prices.",
    },
  ];
  b.priorities.forEach((p, i) =>
    ideas.push({
      id: `idea-priority-${i}`,
      title: `Put ${p.toLowerCase()} first`,
      category: "Your priorities",
      description: priorityIdea(p),
      relevance: `You selected ${p.toLowerCase()} as one of your top priorities.`,
    }),
  );
  if (b.details.category === "wedding")
    ideas.push({
      id: "idea-category",
      title: `A ${b.details.ceremonyStyle} ceremony flow`,
      category: "Wedding",
      description: `Plan the key rituals and transitions for your ${b.details.ceremonyStyle} ceremony with the people taking part. Build in a quiet break.`,
      relevance: "Matches your ceremony preference.",
    });
  if (b.details.category === "birthday")
    ideas.push({
      id: "idea-category",
      title: "An activity with a backup",
      category: "Birthday",
      description: `For the ${b.details.ageGroup} age group, plan “${b.details.activities}” in short, flexible sessions and keep a simple indoor alternative.`,
      relevance: "Reflects your age group and preferred activities.",
    });
  if (b.details.category === "community")
    ideas.push({
      id: "idea-category",
      title: "Give the team a simple role map",
      category: "Community",
      description: `For your ${b.details.format}, map setup, welcoming and wrap-up responsibilities across ${b.details.volunteers} volunteers. Identify uncovered roles early.`,
      relevance: "Fits your format and current volunteer capacity.",
    });
  if (b.dietary)
    ideas.push({
      id: "idea-dietary",
      title: "Make dietary choices easy to find",
      category: "Inclusion",
      description: `Share these requirements with food providers: ${b.dietary}. Confirm ingredients and label options clearly.`,
      relevance: "Addresses the dietary information you supplied.",
    });
  if (b.accessibility)
    ideas.push({
      id: "idea-access",
      title: "Plan access before the layout",
      category: "Inclusion",
      description: `Discuss these access needs with the venue: ${b.accessibility}. Check the arrival route, facilities and seating.`,
      relevance: "Carries your accessibility requirements into the plan.",
    });
  return ideas;
}
function priorityIdea(p: string): string {
  const content: Record<string, string> = {
    "Food quality":
      "Compare sample menus, portions and dietary handling. Prioritize a reliable service plan over menu size.",
    Photography:
      "Write a short list of must-capture moments and compare portfolios and deliverables.",
    Venue: "Compare capacity, access, travel and included equipment before committing.",
    Decoration: "Choose a few focal elements and reuse them across the event.",
    Entertainment:
      "Build short activities around the guest group and prepare a simple alternative.",
    Affordability:
      "Compare itemized quotes, reduce optional extras and keep a firm spending ceiling.",
    Sustainability: "Borrow or reuse decor, offer water refill points and plan waste collection.",
    Accessibility:
      "Check step-free routes, accessible facilities, seating and clear event information.",
    "Educational value":
      "Set a useful learning outcome and leave time for questions and participation.",
    "Volunteer coordination":
      "Assign a lead, write clear shifts and keep a backup for each key role.",
  };
  return content[p] ?? "Compare practical options against your event needs.";
}
function risksFor(b: EventBrief): RiskRecommendation[] {
  const risks: RiskRecommendation[] =
    b.category === "wedding"
      ? [
          {
            id: "risk-vendor",
            risk: "A supplier cancels",
            reason: "A late cancellation can affect several parts of the ceremony.",
            mitigation: "Confirm responsibilities, deadlines and cancellation terms in writing.",
            backup: "Keep an alternative contact and a simplified setup plan.",
          },
          {
            id: "risk-guests",
            risk: "Guest numbers change",
            reason: "Final attendance affects catering, seating and transport.",
            mitigation: "Set an RSVP date and confirm the final count with suppliers.",
            backup: "Agree on flexible portions and a small seating buffer.",
          },
          {
            id: "risk-schedule",
            risk: "Ceremony timings slip",
            reason: "Travel and rituals can take longer than planned.",
            mitigation: "Add buffers and give one coordinator the shared run sheet.",
            backup: "Identify optional transitions that can be shortened.",
          },
        ]
      : b.category === "birthday"
        ? [
            {
              id: "risk-activity",
              risk: "An activity falls through",
              reason: "Entertainment availability or suitability may change.",
              mitigation: "Confirm the activity details and suitability for your guest group.",
              backup: "Keep a simple group game or music activity ready.",
            },
            {
              id: "risk-guests",
              risk: "Unexpected guest changes",
              reason: "Attendance affects portions and supervision.",
              mitigation: "Collect RSVPs and confirm numbers before ordering.",
              backup: "Keep flexible portions and an extra table plan.",
            },
            {
              id: "risk-supplies",
              risk: "Supplies arrive late",
              reason: "Cake, food or decorations may miss the setup window.",
              mitigation: "Confirm delivery contacts and order essentials ahead.",
              backup: "Identify nearby pickup options and simplify decor.",
            },
          ]
        : [
            {
              id: "risk-equipment",
              risk: "Equipment fails",
              reason: "Audio or power problems can interrupt the program.",
              mitigation: "Test equipment and confirm power access before the event.",
              backup: "Keep printed materials and an activity that needs no power.",
            },
            {
              id: "risk-volunteers",
              risk: "Volunteer coverage is short",
              reason: `Your ${b.details.category === "community" ? b.details.volunteers : 0} volunteers may not cover every role or shift.`,
              mitigation: "Assign clear shifts and identify a backup for each essential role.",
              backup: "Reduce optional stations and protect welcoming and safety roles.",
            },
            {
              id: "risk-attendance",
              risk: "Attendance differs from expectations",
              reason: "Crowding or low turnout changes the event experience.",
              mitigation: "Track registrations, capacity and essential facilities.",
              backup: "Use a flexible layout and a scaled program.",
            },
          ];
  const allText = [
    b.notes,
    b.location,
    b.details.category === "birthday" ? b.details.celebrationStyle : b.details.theme,
  ].join(" ");
  if (/outdoor|garden|beach|park|terrace|open.air/i.test(allText))
    risks.push({
      id: "risk-weather",
      risk: "Weather affects outdoor plans",
      reason: "Rain, heat or wind can disrupt an outdoor setup.",
      mitigation: "Monitor the forecast near the date and agree on a decision time.",
      backup: "Arrange an indoor or covered alternative and a guest update method.",
    });
  if (b.accessibility)
    risks.push({
      id: "risk-access",
      risk: "An access barrier is missed",
      reason: "The venue layout may not meet the needs you described.",
      mitigation: "Walk the access route and confirm arrangements with the venue.",
      backup: "Keep an accessible alternate space and a named support contact.",
    });
  return risks;
}
export function generatePlan(input: EventBrief, referenceDate = todayLocal()): EventPlan {
  const b = creationSchema(referenceDate).parse(input);
  const budget = allocateBudget(b.category, b.budget);
  return {
    kind: "rule-based",
    version: 1,
    referenceDate,
    budget,
    timeline: buildTimeline(b, referenceDate),
    vendors: buildVendors(b.category, budget),
    ideas: ideasFor(b),
    risks: risksFor(b),
  };
}
export function createRecord(
  brief: EventBrief,
  referenceDate = todayLocal(),
  id = crypto.randomUUID(),
  now = new Date().toISOString(),
): EventRecord {
  return recordSchema.parse({
    id,
    schemaVersion: 1,
    brief,
    plan: generatePlan(brief, referenceDate),
    createdAt: now,
    updatedAt: now,
  });
}
