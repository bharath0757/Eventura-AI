"use client";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Cake, Users, ShieldCheck, Sparkles } from "lucide-react";
import type { ZodError } from "zod";
import type { Category, CategoryDetails } from "@/types";
import { categories, categoryLabels, priorityOptions, priorityDescriptions, limits } from "@/lib/config";
import { detailsSchema, categoryDetailsSchema, budgetSchema, creationSchema, parseIntegerInput } from "@/lib/validation/schemas";
import { todayLocal, money, formatDate } from "@/lib/dates";
import { createRecord } from "@/lib/planner";
import { eventStore } from "@/lib/storage/events";
import { Button, Notice } from "./controls";

const steps=["The essentials","Make it yours","Budget & priorities","Review & create"];
function defaults(category:Category):CategoryDetails {
  if(category==="wedding")return {category,ceremonyStyle:"traditional",theme:""};
  if(category==="birthday")return {category,ageGroup:"adults",celebrationStyle:"",activities:""};
  return {category,format:"meetup",theme:"",volunteers:0};
}
function Field({id,label,error,hint,children}:{id:string;label:string;error?:string;hint?:string;children:ReactNode}) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint?<small id={`${id}-hint`}>{hint}</small>:null}{error?<p className="field-error" id={`${id}-error`}>{error}</p>:null}</div>;
}
export function Wizard({initialCategory}:{initialCategory?:Category}) {
  const router=useRouter();
  const [step,setStep]=useState(0);
  const [category,setCategory]=useState<Category>(initialCategory??"wedding");
  const [details,setDetails]=useState<CategoryDetails>(()=>defaults(initialCategory??"wedding"));
  const [name,setName]=useState(""),[date,setDate]=useState(""),[location,setLocation]=useState(""),[guests,setGuests]=useState("");
  const [budget,setBudget]=useState(""),[priorities,setPriorities]=useState<string[]>([]);
  const [dietary,setDietary]=useState(""),[accessibility,setAccessibility]=useState(""),[notes,setNotes]=useState("");
  const [volunteers,setVolunteers]=useState("0");
  const [errors,setErrors]=useState<Record<string,string>>({}),[failure,setFailure]=useState("");
  const [busy,setBusy]=useState(false);
  const locked=useRef(false),heading=useRef<HTMLHeadingElement>(null);
  const brief=()=>({category,name,date,location,guests:parseIntegerInput(guests),details:details.category==="community"?{...details,volunteers:parseIntegerInput(volunteers)}:details,budget:parseIntegerInput(budget),priorities,dietary,accessibility,notes});
  function changeCategory(next:Category) {
    if(next===category)return;
    setCategory(next);setDetails(defaults(next));setPriorities([]);setVolunteers("0");setErrors({});
  }
  function showErrors(error:ZodError) {
    const map:Record<string,string>={};
    for(const issue of error.issues){const key=String(issue.path.at(-1)??"form");map[key]??=issue.message;}
    setErrors(map);
    requestAnimationFrame(()=>document.getElementById(Object.keys(map)[0])?.focus());
  }
  function go(next:number) {setStep(next);setErrors({});setFailure("");requestAnimationFrame(()=>heading.current?.focus());}
  function next() {
    const b=brief();
    const result=step===0?detailsSchema.refine(v=>v.date>=todayLocal(),{path:["date"],message:"Choose today or a future date."}).safeParse(b):
      step===1?categoryDetailsSchema.safeParse(b.details):budgetSchema.safeParse(b);
    if(!result.success){showErrors(result.error);return;}
    go(step+1);
  }
  function create() {
    if(locked.current)return;
    const result=creationSchema().safeParse(brief());
    if(!result.success){
      const field=String(result.error.issues[0]?.path[0]);
      const index=["name","date","location","guests","category"].includes(field)?0:field==="details"?1:2;
      setStep(index);showErrors(result.error);return;
    }
    locked.current=true;setBusy(true);setFailure("");
    try {
      const record=createRecord(result.data);
      eventStore().save(record);
      router.push(`/events/${record.id}`);
    } catch(e) {
      setFailure(e instanceof Error?e.message:"The event could not be created. Your details are still here.");
      locked.current=false;setBusy(false);
    }
  }
  function submit(e:FormEvent) {e.preventDefault();if(step<3)next();else create();}
  const attrs=(id:string)=>({"aria-invalid":!!errors[id],"aria-describedby":errors[id]?`${id}-error`:undefined});
  const categoryIcon={wedding:Heart,birthday:Cake,community:Users};
  const Icon=categoryIcon[category];
  const numericBudget=parseIntegerInput(budget);
  return <div className="container page">
    <div className="wizard-intro"><p className="eyebrow">A great event starts here</p><h1>Let’s make it <em>yours.</em></h1><p className="muted">A few thoughtful details. One clear plan.</p></div>
    <ol className="stepper" aria-label="Event creation progress">{steps.map((label,i)=><li className={i===step?"active":i<step?"done":""} key={label}><button type="button" disabled={i>step||busy} onClick={()=>go(i)} aria-current={i===step?"step":undefined}><span>{i<step?<Check size={15}/>:i+1}</span><span>{label}</span></button></li>)}</ol>
    <div className="wizard-layout"><form className="panel wizard-panel" onSubmit={submit} noValidate aria-busy={busy}>
      <div className="form-title"><p className="eyebrow">Step 0{step+1} / 04</p><h2 ref={heading} tabIndex={-1}>{steps[step]}</h2><p className="muted">{["Tell us when, where and who’s coming.","The details that give your occasion its character.","Give your plan a spending ceiling and a sense of direction.","Take a moment to check the details. You can edit any section."][step]}</p></div>
      {failure?<Notice>{failure}</Notice>:null}
      {step===0?<div className="form-fields">
        <fieldset className="category-picker"><legend>What are you planning?</legend><div>{categories.map(c=>{const C=categoryIcon[c];return <button type="button" key={c} aria-pressed={category===c} className={category===c?"selected":""} onClick={()=>changeCategory(c)}><C size={20}/>{categoryLabels[c]}</button>;})}</div></fieldset>
        <Field id="name" label="Event name" error={errors.name}><input id="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Give your moment a name" maxLength={80} autoComplete="off" {...attrs("name")}/></Field>
        <div className="field-grid"><Field id="date" label="Event date" error={errors.date}><input id="date" type="date" value={date} onChange={e=>setDate(e.target.value)} {...attrs("date")}/></Field><Field id="guests" label="Expected guests" error={errors.guests} hint="A whole number, from 1 to 1,00,000."><input id="guests" inputMode="numeric" value={guests} onChange={e=>setGuests(e.target.value)} placeholder="e.g. 80" {...attrs("guests")}/></Field></div>
        <Field id="location" label="City or location" error={errors.location}><input id="location" value={location} onChange={e=>setLocation(e.target.value)} maxLength={120} placeholder="e.g. Hyderabad, Telangana" {...attrs("location")}/></Field>
      </div>:null}
      {step===1?<div className="form-fields">
        {details.category==="wedding"?<>
          <Field id="ceremonyStyle" label="Ceremony style" error={errors.ceremonyStyle}><select id="ceremonyStyle" value={details.ceremonyStyle} onChange={e=>{const v=e.target.value;if(v==="traditional"||v==="modern"||v==="fusion"||v==="minimalist")setDetails({...details,ceremonyStyle:v});}} {...attrs("ceremonyStyle")}><option value="traditional">Traditional</option><option value="modern">Modern</option><option value="fusion">Fusion</option><option value="minimalist">Minimalist</option></select></Field>
          <Field id="theme" label="Theme & atmosphere" error={errors.theme} hint="Describe the feeling, colors or setting you have in mind."><textarea id="theme" value={details.theme} onChange={e=>setDetails({...details,theme:e.target.value})} maxLength={160} placeholder="Warm florals, a garden ceremony, an intimate feel…" {...attrs("theme")}/></Field>
        </>:null}
        {details.category==="birthday"?<>
          <Field id="ageGroup" label="Who is the celebration for?" error={errors.ageGroup}><select id="ageGroup" value={details.ageGroup} onChange={e=>{const v=e.target.value;if(v==="children"||v==="teenagers"||v==="adults"||v==="mixed")setDetails({...details,ageGroup:v});}}><option value="children">Children</option><option value="teenagers">Teenagers</option><option value="adults">Adults</option><option value="mixed">Mixed ages</option></select></Field>
          <Field id="celebrationStyle" label="Celebration style" error={errors.celebrationStyle}><input id="celebrationStyle" value={details.celebrationStyle} onChange={e=>setDetails({...details,celebrationStyle:e.target.value})} maxLength={160} placeholder="A relaxed garden lunch, a colorful game night…" {...attrs("celebrationStyle")}/></Field>
          <Field id="activities" label="Preferred activities" error={errors.activities}><textarea id="activities" value={details.activities} onChange={e=>setDetails({...details,activities:e.target.value})} maxLength={300} placeholder="Music, crafts, group games, storytelling…" {...attrs("activities")}/></Field>
        </>:null}
        {details.category==="community"?<>
          <Field id="format" label="Event format" error={errors.format}><select id="format" value={details.format} onChange={e=>{const v=e.target.value;if(v==="workshop"||v==="festival"||v==="meetup"||v==="fundraiser"||v==="neighborhood"||v==="other")setDetails({...details,format:v});}}><option value="workshop">Workshop</option><option value="festival">Festival</option><option value="meetup">Meetup</option><option value="fundraiser">Fundraiser</option><option value="neighborhood">Neighborhood gathering</option><option value="other">Other</option></select></Field>
          <Field id="theme" label="Theme or purpose" error={errors.theme}><textarea id="theme" value={details.theme} onChange={e=>setDetails({...details,theme:e.target.value})} maxLength={160} placeholder="What will bring your community together?" {...attrs("theme")}/></Field>
          <Field id="volunteers" label="Volunteer count" error={errors.volunteers} hint="Enter 0 if not applicable."><input id="volunteers" inputMode="numeric" value={volunteers} onChange={e=>setVolunteers(e.target.value)} {...attrs("volunteers")}/></Field>
        </>:null}
      </div>:null}
      {step===2?<div className="form-fields">
        <Field id="budget" label="Total budget (INR)" error={errors.budget} hint={Number.isFinite(numericBudget)?`Your budget: ${money(numericBudget)} · Range ₹1,000–₹10,00,00,000.`:"Whole rupees only. Range ₹1,000–₹10,00,00,000."}><div className="currency-input"><span>₹</span><input id="budget" inputMode="numeric" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="50000" {...attrs("budget")}/><span>INR</span></div></Field>
        <fieldset className="priority-picker" id="priorities" tabIndex={-1} aria-describedby={errors.priorities?"priorities-error":"priorities-hint"}><legend>What matters most? <span>{priorities.length}/3 selected</span></legend><p id="priorities-hint" className="muted">Choose one to three priorities.</p><div className="priority-grid">{priorityOptions[category].map(p=><button key={p} type="button" aria-pressed={priorities.includes(p)} disabled={priorities.length>=3&&!priorities.includes(p)} onClick={()=>setPriorities(old=>old.includes(p)?old.filter(v=>v!==p):[...old,p])} className={priorities.includes(p)?"selected":""}><span className="selection-check">{priorities.includes(p)?<Check size={12}/>:null}</span><span><strong>{p}</strong><small>{priorityDescriptions[p]}</small></span></button>)}</div>{errors.priorities?<p id="priorities-error" className="field-error">{errors.priorities}</p>:null}</fieldset>
        <div className="field-grid"><Field id="dietary" label="Dietary requirements (optional)" error={errors.dietary}><textarea id="dietary" value={dietary} onChange={e=>setDietary(e.target.value)} maxLength={500} placeholder="Vegetarian options, allergies…" {...attrs("dietary")}/></Field><Field id="accessibility" label="Accessibility needs (optional)" error={errors.accessibility}><textarea id="accessibility" value={accessibility} onChange={e=>setAccessibility(e.target.value)} maxLength={500} placeholder="Step-free entry, quiet space…" {...attrs("accessibility")}/></Field></div>
        <Field id="notes" label="Anything else? (optional)" error={errors.notes} hint={`${notes.length}/${limits.notesMax} characters`}><textarea id="notes" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} placeholder="Special instructions or details to keep with your event…" {...attrs("notes")}/></Field>
      </div>:null}
      {step===3?<div className="review">
        <ReviewSection title="The essentials" onEdit={()=>go(0)}><dl><dt>Event</dt><dd>{name} · {categoryLabels[category]}</dd><dt>When & where</dt><dd>{formatDate(date)} · {location}</dd><dt>Guests</dt><dd>{guests}</dd></dl></ReviewSection>
        <ReviewSection title="Your style" onEdit={()=>go(1)}><dl>{Object.entries(details).filter(([key])=>key!=="category").map(([key,value])=><div className="dl-row" key={key}><dt>{{ceremonyStyle:"Ceremony",ageGroup:"Age group",celebrationStyle:"Style",theme:"Theme",activities:"Activities",format:"Format",volunteers:"Volunteers"}[key]??key}</dt><dd>{key==="volunteers"?volunteers:String(value)}</dd></div>)}</dl></ReviewSection>
        <ReviewSection title="Budget & requirements" onEdit={()=>go(2)}><dl><dt>Total budget</dt><dd className="review-budget">{money(numericBudget)}</dd><dt>Priorities</dt><dd>{priorities.join(" · ")}</dd>{dietary?<><dt>Dietary</dt><dd>{dietary}</dd></>:null}{accessibility?<><dt>Accessibility</dt><dd>{accessibility}</dd></>:null}{notes?<><dt>Notes</dt><dd>{notes}</dd></>:null}</dl></ReviewSection>
        <Notice tone="info">Your plan uses transparent rules and estimates, including a 10% contingency reserve. It is saved only in this browser. After creation, open AI assistant for personalized Gemini ideas, questions and protected budget options. Live assistance falls back to labelled rule-based guidance when unavailable.</Notice>
      </div>:null}
      <div className="form-actions"><Button className="secondary" type="button" disabled={step===0||busy} onClick={()=>go(step-1)}><ArrowLeft size={16}/> Back</Button><Button type="submit" disabled={busy} loading={busy}>{step===3?(busy?"Creating your plan…":"Create my event"):"Continue"}{!busy?<ArrowRight size={16}/>:null}</Button></div>
    </form><aside className="wizard-aside"><div className="aside-icon"><Icon size={30} strokeWidth={1.4}/></div><p className="eyebrow">YOUR OCCASION, YOUR WAY</p><h3>{name||"Something worth celebrating."}</h3><p className="muted">A thoughtful plan leaves more room for the moments that matter.</p><dl className="aside-summary"><dt>Occasion</dt><dd>{categoryLabels[category]}</dd><dt>Guests</dt><dd>{guests||"To be decided"}</dd><dt>Budget</dt><dd>{Number.isFinite(numericBudget)?money(numericBudget):"Your call"}</dd></dl><div className="aside-note"><ShieldCheck size={20}/><p>No sign-up. No API keys.<br/>Plans are saved in this browser.</p></div><div className="aside-note"><Sparkles size={20}/><p>A rule-based starting point.<br/>Make it your own as you go.</p></div></aside></div>
  </div>;
}
function ReviewSection({title,onEdit,children}:{title:string;onEdit:()=>void;children:ReactNode}) {
  return <section className="review-section"><div><h3>{title}</h3><button type="button" className="text-link" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>Edit <ArrowRight size={13}/></button></div>{children}</section>;
}
