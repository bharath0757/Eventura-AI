import { z } from "zod";
import { isCalendarDate, todayLocal } from "../dates";
import { categories, priorityOptions, limits } from "../config";
import { savedIdeaSchema } from "../ai/contracts";

export const dateSchema = z.string().refine(isCalendarDate,"Enter a valid calendar date.");
const text = (max: number) => z.string().trim().min(1,"This field is required.").max(max,`Use at most ${max} characters.`);
const optionalText = z.string().trim().max(limits.requirementsMax).default("");
export const detailsSchema = z.object({
  category:z.enum(categories),
  name:text(80),
  date:dateSchema,
  location:text(120),
  guests:z.number({error:"Enter a whole guest count."}).int("Use a whole number.").min(1,"At least one guest is required.").max(limits.guestsMax)
});
export const categoryDetailsSchema = z.discriminatedUnion("category",[
  z.object({category:z.literal("wedding"),ceremonyStyle:z.enum(["traditional","modern","fusion","minimalist"]),theme:text(limits.themeMax)}).strict(),
  z.object({category:z.literal("birthday"),ageGroup:z.enum(["children","teenagers","adults","mixed"]),celebrationStyle:text(limits.themeMax),activities:text(300)}).strict(),
  z.object({category:z.literal("community"),format:z.enum(["workshop","festival","meetup","fundraiser","neighborhood","other"]),theme:text(limits.themeMax),volunteers:z.number({error:"Enter a whole volunteer count."}).int().min(0).max(limits.guestsMax)}).strict()
]);
export const budgetSchema = z.object({
  budget:z.number({error:"Enter a whole rupee amount without commas or symbols."}).int("Enter a whole rupee amount.").min(limits.budgetMin,"The minimum budget is ₹1,000.").max(limits.budgetMax,"The maximum budget is ₹10,00,00,000."),
  priorities:z.array(text(40)).min(1,"Select at least one priority.").max(3,"Select no more than three priorities.").refine(v=>new Set(v).size===v.length,"Choose distinct priorities."),
  dietary:optionalText, accessibility:optionalText,
  notes:z.string().trim().max(limits.notesMax).default("")
});
export const briefSchema = detailsSchema.extend({
  ...budgetSchema.shape,
  details:categoryDetailsSchema
}).strict().superRefine((b,ctx)=>{
  if(b.category!==b.details.category) ctx.addIssue({code:"custom",path:["details"],message:"Event category and details must match."});
  const options:readonly string[] = priorityOptions[b.category];
  if(b.priorities.some(p=>!options.includes(p))) ctx.addIssue({code:"custom",path:["priorities"],message:"Choose priorities for this event category."});
});
/** Creation rejects past dates; stored records intentionally allow historical events. */
export function creationSchema(referenceDate=todayLocal()) {
  if(!isCalendarDate(referenceDate)) throw new Error("Invalid reference date.");
  return briefSchema.refine(b=>b.date>=referenceDate,{path:["date"],message:"Choose today or a future date."});
}
export const statusSchema = z.enum(["pending","in-progress","completed"]);
const priority = z.enum(["high","medium","low"]);
const id = text(120);
const budgetItemSchema = z.object({
  id,category:text(80),label:text(100),percentage:z.number().int().min(0).max(100),
  amount:z.number().int().min(0).max(limits.budgetMax),contingency:z.boolean()
}).strict();
const timelineTaskSchema = z.object({
  id,title:text(160),description:text(1000),dueDate:dateSchema,originalDueDate:dateSchema,
  priority,status:statusSchema,urgent:z.boolean()
}).strict();
const vendorTaskSchema = z.object({
  id,category:text(80),title:text(160),description:text(1000),priority,status:statusSchema,
  estimatedCost:z.number().int().min(0).max(limits.budgetMax).optional()
}).strict();
const ideaSchema=z.object({id,title:text(160),description:text(1500),category:text(80),relevance:text(1500)}).strict();
const riskSchema=z.object({id,risk:text(160),reason:text(1500),mitigation:text(1500),backup:text(1500)}).strict();
export const planSchema = z.object({
  kind:z.literal("rule-based"),version:z.literal(1),referenceDate:dateSchema,
  budget:z.array(budgetItemSchema).min(1),
  timeline:z.array(timelineTaskSchema).min(1),
  vendors:z.array(vendorTaskSchema).min(1),
  ideas:z.array(ideaSchema).min(3),
  risks:z.array(riskSchema).min(3)
}).strict();
const timestamp=z.iso.datetime();
export const recordSchema=z.object({
  id:z.uuid(),schemaVersion:z.literal(1),brief:briefSchema,plan:planSchema,createdAt:timestamp,updatedAt:timestamp,
  savedIdeas:z.array(savedIdeaSchema).max(30).optional()
}).strict().superRefine((record,ctx)=>{
  const {brief,plan}=record;
  const fail=(message:string)=>ctx.addIssue({code:"custom",path:["plan"],message});
  if(plan.budget.reduce((s,i)=>s+i.amount,0)!==brief.budget) fail("Budget amounts must equal the event budget.");
  if(plan.budget.reduce((s,i)=>s+i.percentage,0)!==100) fail("Allocation percentages must total 100.");
  if(!plan.budget.some(i=>i.contingency&&i.amount>0)) fail("A contingency reserve is required.");
  for(const items of [plan.budget,plan.timeline,plan.vendors,plan.ideas,plan.risks]) {
    if(new Set(items.map(i=>i.id)).size!==items.length) fail("Plan IDs must be unique within each section.");
  }
  if(plan.referenceDate>brief.date) fail("Planning date cannot follow the event date.");
  for(const task of plan.timeline) {
    if(task.dueDate<plan.referenceDate||task.dueDate>brief.date) fail("Task due dates must fall in the planning window.");
    if(task.urgent!==(task.originalDueDate<plan.referenceDate)) fail("Urgency must reflect the original deadline.");
    if(task.dueDate!==(task.urgent?plan.referenceDate:task.originalDueDate)) fail("Actionable deadline does not match the original deadline.");
  }
  if(record.updatedAt<record.createdAt) ctx.addIssue({code:"custom",path:["updatedAt"],message:"Updated time cannot precede creation."});
});
export function parseIntegerInput(value:string): number {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : NaN;
}
