import type { Category, EventBrief, EventRecord } from "@/types";
import { createRecord } from "@/lib/planner";
export const reference="2026-10-23";
export function fixture(category:Category="wedding",overrides:Partial<EventBrief>={}):EventBrief {
  const details=category==="wedding"?{category,ceremonyStyle:"fusion" as const,theme:"Outdoor garden florals"}:
    category==="birthday"?{category,ageGroup:"children" as const,celebrationStyle:"Colorful craft party",activities:"Painting and group games"}:
    {category,format:"workshop" as const,theme:"Community learning",volunteers:8};
  return {category,name:"A meaningful occasion",date:"2027-02-14",location:"Hyderabad",guests:80,budget:15001,priorities:category==="community"?["Educational value"]:["Food quality"],details,dietary:"Vegetarian",accessibility:"Step-free entry",notes:"",...overrides};
}
export const ids=["a3e2f211-c082-48e9-8847-f8d18f73b5bd","8c8fe1a1-2356-4d8d-a5ba-b9d2a87fc64c","e9667805-b506-481f-8f14-1d918d997189"];
export function record(category:Category="wedding",id=ids[0]):EventRecord {
  return createRecord(fixture(category),reference,id,"2026-10-23T12:00:00.000Z");
}
