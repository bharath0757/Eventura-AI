import { describe,expect,it } from "vitest";
import { categories } from "@/lib/config";
import { allocateBudget,generatePlan } from "@/lib/planner";
import { budgetProfiles,milestones } from "@/lib/planner/profiles";
import { addDays,isCalendarDate } from "@/lib/dates";
import { fixture,reference } from "./fixtures";
describe("exact budget accounting",()=>{
  for(const category of categories) {
    it(`${category}: allocation profile totals exactly 100%`,()=>expect(budgetProfiles[category].reduce((s,i)=>s+i.percentage,0)).toBe(100));
    for(const total of [1000,15001,500003,100000000])it(`${category}: allocates ₹${total} exactly and reproducibly`,()=>{
      const items=allocateBudget(category,total);
      expect(items.reduce((s,i)=>s+i.amount,0)).toBe(total);
      expect(items.reduce((s,i)=>s+i.percentage,0)).toBe(100);
      expect(items.every(i=>Number.isSafeInteger(i.amount)&&i.amount>=0)).toBe(true);
      expect(items.find(i=>i.contingency)?.amount).toBeGreaterThan(0);
      expect(allocateBudget(category,total)).toEqual(items);
      expect(items.map(i=>i.category)).toEqual(budgetProfiles[category].map(i=>i.key));
    });
  }
  it("keeps exact totals across 300 varying budgets",()=>{for(let n=1000;n<1300;n++)for(const c of categories)expect(allocateBudget(c,n).reduce((s,i)=>s+i.amount,0)).toBe(n);});
  it("uses category-specific profiles",()=>expect(allocateBudget("wedding",15001)).not.toEqual(allocateBudget("birthday",15001)));
});
describe("complete deterministic plans",()=>{
  for(const category of categories) {
    it(`${category}: contains complete planning content`,()=>{
      const b=fixture(category),plan=generatePlan(b,reference);
      expect(plan.kind).toBe("rule-based");expect(plan.budget.length).toBeGreaterThan(0);
      expect(plan.timeline.length).toBeGreaterThan(3);expect(plan.vendors.length).toBeGreaterThan(3);
      expect(plan.ideas.length).toBeGreaterThanOrEqual(3);expect(plan.risks.length).toBeGreaterThanOrEqual(3);
      expect(generatePlan(b,reference)).toEqual(plan);
      for(const t of plan.timeline){expect(isCalendarDate(t.dueDate)).toBe(true);expect(t.dueDate>=reference).toBe(true);expect(t.dueDate<=b.date).toBe(true);}
      expect(plan.timeline[0].originalDueDate).toBe(addDays(b.date,-milestones[category][0].daysBefore));
    });
    it(`${category}: soon-upcoming events receive urgent actionable tasks`,()=>{
      const plan=generatePlan(fixture(category,{date:reference}),reference);
      expect(plan.timeline.every(t=>t.dueDate===reference)).toBe(true);
      expect(plan.timeline.some(t=>t.urgent&&t.originalDueDate<reference)).toBe(true);
      expect(plan.timeline.at(-1)?.urgent).toBe(false);
      expect(plan.timeline.map(t=>t.id)).toEqual(generatePlan(fixture(category,{date:reference}),reference).timeline.map(t=>t.id));
    });
  }
  it("personalizes recommendations from guest, style and priority data",()=>{
    const a=generatePlan(fixture("birthday"),reference),b=generatePlan(fixture("birthday",{guests:300,priorities:["Affordability"],budget:1000,details:{category:"birthday",ageGroup:"adults",celebrationStyle:"Evening music",activities:"Singing"}}),reference);
    expect(a.ideas).not.toEqual(b.ideas);
    expect(b.ideas.some(i=>i.description.includes("Evening music"))).toBe(true);
    expect(b.ideas.some(i=>i.title.includes("affordability"))).toBe(true);
  });
  it("adds outdoor weather and access contingencies when relevant",()=>{const p=generatePlan(fixture(),reference);expect(p.risks.some(r=>r.id==="risk-weather")).toBe(true);expect(p.risks.some(r=>r.id==="risk-access")).toBe(true);});
  it("does not invent an outdoor risk for an indoor event",()=>expect(generatePlan(fixture("birthday"),reference).risks.some(r=>r.id==="risk-weather")).toBe(false));
  it("supports the maximum theme length in generated records",()=>{const b=fixture("wedding",{details:{category:"wedding",ceremonyStyle:"traditional",theme:"x".repeat(160)}});expect(generatePlan(b,reference).ideas.every(i=>i.title.length<=160)).toBe(true);});
  it("rejects unvalidated input even when UI is bypassed",()=>expect(()=>generatePlan(fixture("wedding",{budget:-1}),reference)).toThrow());
});
