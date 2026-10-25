import type { Category } from "@/types";
export interface BudgetProfile {key:string;label:string;percentage:number;contingency?:boolean}
export interface Milestone {key:string;title:string;description:string;daysBefore:number;priority:"high"|"medium"|"low"}
/** INR estimates, not market quotes. Change weights here; each profile must total 100. */
export const budgetProfiles: Record<Category,readonly BudgetProfile[]> = {
  wedding:[
    {key:"venue",label:"Venue",percentage:22},{key:"food",label:"Catering",percentage:30},
    {key:"photo",label:"Photography",percentage:12},{key:"decor",label:"Decoration",percentage:10},
    {key:"styling",label:"Clothing & styling",percentage:8},{key:"entertainment",label:"Entertainment",percentage:4},
    {key:"logistics",label:"Logistics & essentials",percentage:4},{key:"reserve",label:"Contingency reserve",percentage:10,contingency:true}
  ],
  birthday:[
    {key:"venue",label:"Venue",percentage:18},{key:"food",label:"Food & cake",percentage:30},
    {key:"decor",label:"Decorations",percentage:15},{key:"entertainment",label:"Activities & entertainment",percentage:15},
    {key:"supplies",label:"Invitations & party favors",percentage:7},{key:"logistics",label:"Logistics",percentage:5},
    {key:"reserve",label:"Contingency reserve",percentage:10,contingency:true}
  ],
  community:[
    {key:"venue",label:"Venue",percentage:20},{key:"equipment",label:"Equipment",percentage:20},
    {key:"food",label:"Refreshments",percentage:15},{key:"program",label:"Program activities",percentage:15},
    {key:"promotion",label:"Promotion & materials",percentage:10},{key:"logistics",label:"Accessibility & logistics",percentage:10},
    {key:"reserve",label:"Contingency reserve",percentage:10,contingency:true}
  ]
};
export const milestones:Record<Category,readonly Milestone[]>={
  wedding:[
    {key:"brief",title:"Align on the celebration",description:"Agree on the ceremony, guest range, priorities and spending ceiling.",daysBefore:90,priority:"high"},
    {key:"venue",title:"Shortlist and visit venues",description:"Check capacity, accessible routes, cancellation terms and an indoor alternative.",daysBefore:75,priority:"high"},
    {key:"vendors",title:"Compare key vendor proposals",description:"Request written catering, photography and decoration estimates before paying deposits.",daysBefore:60,priority:"high"},
    {key:"guests",title:"Send invitations and gather needs",description:"Confirm guest addresses, dietary requirements and travel support.",daysBefore:30,priority:"medium"},
    {key:"confirm",title:"Confirm ceremony and supplier timings",description:"Share a run sheet and emergency contacts with your main point of contact.",daysBefore:14,priority:"high"},
    {key:"final",title:"Check final numbers and readiness",description:"Review RSVPs, balances, transport and backup arrangements.",daysBefore:2,priority:"high"},
    {key:"day",title:"Celebrate with a shared run sheet",description:"Give a trusted coordinator the schedule so you can enjoy the day.",daysBefore:0,priority:"medium"}
  ],
  birthday:[
    {key:"brief",title:"Choose the celebration style",description:"Set a guest range, age-appropriate activities and the budget.",daysBefore:30,priority:"high"},
    {key:"space",title:"Confirm the space and activities",description:"Check capacity, accessibility, supervision and any activity restrictions.",daysBefore:21,priority:"high"},
    {key:"invite",title:"Send invitations",description:"Collect RSVPs, dietary needs and parent contacts when appropriate.",daysBefore:14,priority:"medium"},
    {key:"supplies",title:"Arrange cake, food and supplies",description:"Confirm delivery windows, portions and a fallback activity.",daysBefore:7,priority:"high"},
    {key:"final",title:"Check the party kit",description:"Prepare the playlist, decorations, first-aid essentials and guest list.",daysBefore:1,priority:"high"},
    {key:"day",title:"Set up and welcome guests",description:"Test the activity area and leave time for setup before guests arrive.",daysBefore:0,priority:"medium"}
  ],
  community:[
    {key:"brief",title:"Define the program and responsibilities",description:"Agree on purpose, audience, spending limit and decision owners.",daysBefore:45,priority:"high"},
    {key:"venue",title:"Check venue and local requirements",description:"Ask the venue about permissions, insurance, occupancy and accessible facilities.",daysBefore:30,priority:"high"},
    {key:"team",title:"Assign volunteer and program roles",description:"Confirm a lead, backup helpers and speaker or activity coordinators.",daysBefore:21,priority:"high"},
    {key:"promote",title:"Open registration and share details",description:"Publish the schedule, location, capacity and accessibility contact.",daysBefore:14,priority:"medium"},
    {key:"equipment",title:"Test equipment and rehearse handovers",description:"Test audio, power and sign-in; share the role roster and contingency plan.",daysBefore:3,priority:"high"},
    {key:"day",title:"Brief the team and open the event",description:"Walk the site, check access routes and assign a welcoming contact.",daysBefore:0,priority:"high"}
  ]
};
export const vendorTemplates:Record<Category,readonly {key:string;title:string;description:string;budgetKey?:string}[]>={
  wedding:[
    {key:"venue",title:"Coordinate the venue",description:"Compare availability, capacity and written venue terms.",budgetKey:"venue"},
    {key:"catering",title:"Request catering proposals",description:"Discuss portions, dietary needs, service and cancellation terms.",budgetKey:"food"},
    {key:"photo",title:"Brief a photographer",description:"Share the moments to capture and confirm deliverables in writing.",budgetKey:"photo"},
    {key:"decor",title:"Plan decoration and setup",description:"Check the theme, setup window and reuse options.",budgetKey:"decor"},
    {key:"transport",title:"Arrange guest logistics",description:"Review transport, parking and accessible arrival options.",budgetKey:"logistics"}
  ],
  birthday:[
    {key:"cake",title:"Arrange food and cake",description:"Confirm portions, allergy handling, delivery and collection.",budgetKey:"food"},
    {key:"decor",title:"Gather decorations",description:"Choose reusable elements that fit the celebration style.",budgetKey:"decor"},
    {key:"activities",title:"Confirm activities or entertainment",description:"Check age suitability, supervision and a simple backup.",budgetKey:"entertainment"},
    {key:"supplies",title:"Prepare supplies and invitations",description:"Count essentials and avoid unnecessary single-use extras.",budgetKey:"supplies"}
  ],
  community:[
    {key:"venue",title:"Confirm venue coordination",description:"Review capacity, access, site rules and any permissions with the venue.",budgetKey:"venue"},
    {key:"equipment",title:"Source and test equipment",description:"Confirm audio, power, cables and an offline alternative.",budgetKey:"equipment"},
    {key:"program",title:"Confirm program contributors",description:"Share a written schedule with speakers or activity coordinators.",budgetKey:"program"},
    {key:"food",title:"Arrange refreshments",description:"Plan portions, safe handling, water and dietary options.",budgetKey:"food"},
    {key:"volunteers",title:"Coordinate volunteers",description:"Assign a lead, written roles and backup coverage."},
    {key:"access",title:"Check accessibility arrangements",description:"Walk arrival routes, toilets and seating with the venue.",budgetKey:"logistics"}
  ]
};
