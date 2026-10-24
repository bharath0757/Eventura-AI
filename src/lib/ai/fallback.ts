import type { AIRequest } from "./schemas";
import type { Recommendations, Optimization, QuestionAnswer, Guidance } from "./contracts";
import { addDays } from "@/lib/dates";
export function localRecommendations(r: AIRequest): Recommendations {
  const b = r.brief;
  const theme = b.details.category === "birthday" ? b.details.celebrationStyle : b.details.theme;
  const category = r.plan.budget.find(i => !i.contingency)!.category;
  const nextActions = r.plan.timeline.filter(t => t.status !== "completed").slice(0, 3).map(t => `${t.title} — ${t.dueDate}`);
  return {
    headline: `Practical next steps for ${b.category === "community" ? "your community event" : `your ${b.category}`}`,
    summary: `${b.name}: plan for ${b.guests} guests in ${b.location}, keeping ${b.priorities.join(", ").toLowerCase()} central. These are rule-based refinements of your starter plan.`,
    ideas: [
      { title: "Turn your theme into one shared moment", category, description: `Choose one reusable focal point for “${theme}” and invite guests to contribute a message, story or activity.`, rationale: `A focused experience suits ${b.guests} guests without spreading your budget across many extras.`, nextAction: "Select a focal activity and ask one helper to coordinate it." },
      { title: "Confirm an inclusive service plan", category: "food", description: `Ask food providers for a clearly labelled menu and portion plan for ${b.guests} guests. Dietary requirements: ${b.dietary || "confirm with guests"}.`, rationale: `Reflects your food needs and priorities: ${b.priorities.join(", ")}.`, nextAction: "Gather dietary responses and request itemized proposals; prices are not verified." },
      { title: "Walk through arrival and participation", category: "logistics", description: `Check routes, seating and clear signs at ${b.location}. Access needs: ${b.accessibility || "check with participants before finalizing"}.`, rationale: b.details.category === "community" ? `Coordinate these checks with your ${b.details.volunteers} volunteers.` : `A short walkthrough helps keep your ${b.category} welcoming.`, nextAction: "Assign a helper to test the guest journey and note alternatives." },
    ],
    risks: r.plan.risks.slice(0, 3).map(risk => ({ risk: risk.risk, relevance: risk.reason.slice(0, 1000), mitigation: `${risk.mitigation} ${risk.backup}`.slice(0, 1000) })),
    nextActions: nextActions.length ? nextActions : ["Review final arrangements and retain a backup contact."],
    assumptions: ["Rule-based suggestions use the current brief and starter templates. Costs, availability and arrangements need confirmation."],
  };
}
export function localOptimization(r: Extract<AIRequest, { operation: "optimize" }>): Optimization {
  const guidance: Guidance[] = r.plan.budget.map(b => ({ category: b.category,
    action: r.protectedCategories.includes(b.category) || b.contingency ? "maintain" : r.targetBudget < r.brief.budget && ["decor", "styling", "promotion", "supplies"].includes(b.category) ? "reduce" : "review",
    rationale: r.protectedCategories.includes(b.category) ? "You asked to keep this amount unchanged." : b.contingency ? "Keep a reserve of at least 10% of the target budget." : "Compare the scope against your priorities before committing.",
    alternative: b.contingency ? "Keep the reserve available for unexpected costs." : "Request itemized options, reuse what you can and simplify optional extras.",
  }));
  return { summary: `A rule-based proposal for ${r.brief.name}, prioritizing ${r.brief.priorities.join(", ").toLowerCase()}. Protected amounts stay fixed; the application calculates all allocations.`, guidance,
    tradeoffs: [r.targetBudget < r.brief.budget ? "Lower flexible allowances may require a simpler format, fewer optional details or new supplier quotes." : "Additional allocation is a planning allowance, not an instruction to spend or a vendor quote."],
    nextActions: ["Compare each proposed allowance with your actual commitments before accepting."],
    assumptions: ["No live prices or vendor availability were checked.", ...(r.instruction ? ["Your free-text priorities require personal review; this fallback uses category rules and protected selections."] : [])] };
}
export function localAnswer(r: Extract<AIRequest, { operation: "ask" }>, today = new Date().toISOString().slice(0, 10)): QuestionAnswer {
  const b = r.brief, q = r.instruction.toLowerCase();
  let answer: string;
  if (/vegetarian|food|cater|diet|menu/.test(q)) answer = `For ${b.guests} guests, compare a seasonal vegetarian buffet with a shorter plated menu or shared platters. Confirm ingredients, allergy handling and portion sizes with the provider. Your stated dietary needs are: ${b.dietary || "none specified"}. Keep choices within the existing food allowance; obtain quotes before changing the plan.`;
  else if (/attend|guest|increase|crowd/.test(q)) answer = `Your current plan covers ${b.guests} guests. Confirm revised RSVPs before committing; review venue capacity, portions, accessible seating and staffing together. Request an itemized incremental quote and use Optimize My Budget to preview changes. Do not assume the reserve alone covers extra guests.`;
  else if (/week|finish|deadline|task|urgent/.test(q)) {
    const due = r.plan.timeline.filter(t => t.status !== "completed" && t.dueDate <= addDays(today, 7)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    answer = due.length ? `Your unfinished milestones due by ${addDays(today, 7)} (including overdue items): ${due.slice(0, 5).map(t => `${t.title} (${t.dueDate})`).join("; ")}. Confirm dependencies and assign an owner to each.` : `No unfinished milestones are due in the next seven days. Review your next deadline and confirm arrangements for ${b.date}.`;
  } else if (/sustain|decor|waste/.test(q)) answer = `For your ${b.category}, borrow reusable decor, concentrate it in one focal area, use refill stations and arrange clearly labelled waste collection. Check access routes stay clear. Prioritize ${b.priorities.join(", ").toLowerCase()} when deciding which extras to remove.`;
  else if (/memorab|cheap|spend|save|cost|budget/.test(q)) answer = `For ${b.name}, make one shared experience the highlight: ${b.details.category === "birthday" ? b.details.activities : b.details.category === "community" ? `a participant-led activity for your ${b.details.format}` : `a personal story or ritual in your ${b.details.ceremonyStyle} ceremony`}. Borrow props and reuse decor. Protect ${b.priorities.join(", ").toLowerCase()} and compare a budget proposal before reducing any committed allowance.`;
  else answer = `I can offer a local starting point for ${b.name}, but cannot fully interpret this question without live AI. For ${b.guests} guests in ${b.location} on ${b.date}, review your priorities (${b.priorities.join(", ")}), confirm requirements with the relevant supplier and identify a backup. Try a specific question about catering, attendance, this week's tasks, sustainability or saving costs.`;
  return { summary: `Rule-based planning help for ${b.name}`, answer, nextActions: ["Confirm the relevant details with your coordinator before making commitments."], assumptions: ["This answer uses bounded topic rules and your current event. It is not a live AI response or a vendor confirmation."] };
}
