"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Users, Wallet, ShieldCheck, ListChecks, Lightbulb, ArrowUpRight, CircleCheck, Clock3 } from "lucide-react";
import type { EventRecord, TaskStatus, TimelineTask, VendorTask } from "@/types";
import { categoryLabels } from "@/lib/config";
import { money, formatDate } from "@/lib/dates";
import { eventStore } from "@/lib/storage/events";
import { statusSchema } from "@/lib/validation/schemas";
import { useEvents } from "./use-events";
import { Button, EmptyState, Notice } from "./controls";
const statusLabels:Record<TaskStatus,string>={pending:"Pending","in-progress":"In progress",completed:"Completed"};
export function EventDashboard({eventId}:{eventId:string}) {
  const {snapshot,error,reload}=useEvents();
  const [saveError,setSaveError]=useState(""),[announcement,setAnnouncement]=useState("");
  const event=snapshot?.events.find(e=>e.id===eventId);
  function status(section:"timeline"|"vendors",taskId:string,value:string) {
    const result=statusSchema.safeParse(value);if(!result.success)return;
    try {eventStore().setTaskStatus(eventId,section,taskId,result.data);reload();setSaveError("");setAnnouncement("Task status saved.");}
    catch(e){setSaveError(e instanceof Error?e.message:"This task could not be saved.");setAnnouncement("");}
  }
  if(error)return <div className="container page"><Notice>{error}</Notice><Button onClick={reload}>Try again</Button><Link href="/events">Return to my events</Link></div>;
  if(!snapshot)return <div className="container page loading-state" role="status">Opening your event plan…</div>;
  if(!event)return <div className="container page"><EmptyState title="We couldn’t find this occasion." description="This event may have been deleted or saved in a different browser. Open My events to see plans stored here."/><Link className="text-link" href="/events">Return to my events <ArrowUpRight size={14}/></Link></div>;
  const {brief,plan}=event;
  const reserve=plan.budget.filter(i=>i.contingency).reduce((s,i)=>s+i.amount,0);
  const tasks=[...plan.timeline,...plan.vendors],done=tasks.filter(t=>t.status==="completed").length;
  const urgent=plan.timeline.filter(t=>t.urgent&&t.status!=="completed").length;
  return <div className="container page dashboard">
    <Link href="/events" className="back-link"><ArrowLeft size={15}/> My events</Link>
    <div className="dashboard-heading"><div><div className="heading-pills"><span className="pill">{categoryLabels[brief.category]}</span><span className="pill baseline"><span>✦</span> Rule-based starter plan</span></div><h1>{brief.name}</h1><div className="event-meta"><span><CalendarDays size={16}/>{formatDate(brief.date)}</span><span><MapPin size={16}/>{brief.location}</span><span><Users size={16}/>{brief.guests} guests</span></div></div><div className="dashboard-completion"><CircleCheck size={22}/><strong>{done}<small>/{tasks.length}</small></strong><span>tasks completed</span></div></div>
    <p className="sr-only" role="status">{announcement}</p>
    {saveError?<Notice>{saveError} Your change has not been applied.</Notice>:null}
    {snapshot.warnings.map((w,i)=><Notice key={i} tone="info">{w}</Notice>)}
    <div className="metric-grid"><Metric icon={<Wallet size={19}/>} label="Total budget" value={money(brief.budget)} detail="100% assigned across the plan"/><Metric icon={<ListChecks size={19}/>} label="Planned spending" value={money(brief.budget-reserve)} detail="Estimates, excluding the reserve"/><Metric icon={<ShieldCheck size={19}/>} label="Contingency reserve" value={money(reserve)} detail="Included in your total budget"/><Metric icon={<Clock3 size={19}/>} label="Urgent milestones" value={String(urgent)} detail="Recommended deadline has passed"/></div>
    <nav className="dashboard-nav" aria-label="Plan sections"><a href="#budget">Budget</a><a href="#timeline">Timeline</a><a href="#vendors">Checklist</a><a href="#ideas">Ideas</a><a href="#risks">Contingencies</a><a href="#brief">Your brief</a></nav>
    <div className="dashboard-grid"><section id="budget" className="panel dashboard-section"><SectionTitle number="01" title="A budget with breathing room" description="Every rupee is assigned, including your reserve. All amounts are estimates, not vendor quotes."/><div className="budget-total"><span>Your estimated allocations</span><strong>{money(brief.budget)}</strong></div><div className="allocation-bar" aria-hidden="true">{plan.budget.map((i,index)=><span key={i.id} className={`allocation-color color-${index}`} style={{width:`${i.percentage}%`}}/>)}</div><div className="allocation-list">{plan.budget.map((item,i)=><div key={item.id}><span className={`color-dot color-${i}`}/><span>{item.label}{item.contingency?<small>Set aside for unexpected costs</small>:null}</span><span className="allocation-percent">{item.percentage}%</span><strong>{money(item.amount)}</strong></div>)}</div><div className="allocation-footer"><span>Allocated total</span><strong>{money(brief.budget)}</strong><span className="positive"><CheckMark/> Adds up exactly</span></div></section>
    <section id="timeline" className="panel dashboard-section"><SectionTitle number="02" title="One step closer, every day" description={`Milestones planned from ${formatDate(plan.referenceDate)} to your event date.`}/><div className="timeline-list">{plan.timeline.map((task,i)=><div key={task.id} className={`timeline-item ${task.status==="completed"?"complete":""}`}><div className="timeline-marker">{task.status==="completed"?<CheckMark/>:String(i+1).padStart(2,"0")}</div><div className="timeline-content"><div className="timeline-due"><span>{formatDate(task.dueDate)}</span>{task.urgent?<span className="urgent-badge">Urgent at creation</span>:null}</div><h3>{task.title}</h3><p>{task.description}</p>{task.urgent?<small>Recommended by {formatDate(task.originalDueDate)}; moved to the planning date.</small>:null}<TaskSelect task={task} onChange={value=>status("timeline",task.id,value)}/></div></div>)}</div></section></div>
    <section id="vendors" className="panel dashboard-section wide-section"><SectionTitle number="03" title="The right people. The right details." description="Use this checklist to coordinate your suppliers and helpers. No businesses, quotes or availability are implied."/><div className="vendor-grid">{plan.vendors.map(task=><article className={`vendor-card ${task.status==="completed"?"complete":""}`} key={task.id}><span className="task-category">{task.category}</span><h3>{task.title}</h3><p>{task.description}</p>{task.estimatedCost!==undefined?<small>Planning allowance: {money(task.estimatedCost)} · estimate</small>:null}<TaskSelect task={task} onChange={value=>status("vendors",task.id,value)}/></article>)}</div></section>
    <section id="ideas" className="wide-section"><SectionTitle number="04" title="A little inspiration, made for you" description="Deterministic starter ideas shaped by your event details and priorities."/><div className="ideas-grid">{plan.ideas.map((idea,i)=><article className={`idea-card ${i%3===0?"lavender":i%3===1?"sage":"peach"}`} key={idea.id}><Lightbulb size={21} strokeWidth={1.5}/><span className="task-category">{idea.category}</span><h3>{idea.title}</h3><p>{idea.description}</p><small>{idea.relevance}</small></article>)}</div></section>
    <section id="risks" className="panel dashboard-section wide-section"><SectionTitle number="05" title="A thoughtful backup goes a long way" description="Practical contingencies, so a small surprise stays small."/><div className="risk-grid">{plan.risks.map(risk=><article key={risk.id}><ShieldCheck size={21}/><h3>{risk.risk}</h3><p>{risk.reason}</p><dl><dt>Plan ahead</dt><dd>{risk.mitigation}</dd><dt>Keep a backup</dt><dd>{risk.backup}</dd></dl></article>)}</div></section>
    <EventBriefCard event={event}/>
    <div className="dashboard-footnote"><ShieldCheck size={17}/><p>Saved only in this browser. Updated {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(event.updatedAt))}.<br/>Rule-based estimates are a starting point. Confirm costs and arrangements with your chosen providers.</p></div>
  </div>;
}
function CheckMark(){return <CircleCheck size={14} aria-hidden="true"/>;}
function Metric({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) {
  return <div className="metric panel"><div>{icon}<span>{label}</span></div><strong>{value}</strong><small>{detail}</small></div>;
}
function SectionTitle({number,title,description}:{number:string;title:string;description:string}) {
  return <div className="section-title"><p className="eyebrow"><span>{number}</span> YOUR EVENT PLAN</p><h2>{title}</h2><p className="muted">{description}</p></div>;
}
function TaskSelect({task,onChange}:{task:TimelineTask|VendorTask;onChange:(value:string)=>void}) {
  return <div className="task-control"><label className="sr-only" htmlFor={task.id}>Status: {task.title}</label><select id={task.id} value={task.status} onChange={e=>onChange(e.target.value)} className={`status-select ${task.status}`}>{Object.entries(statusLabels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select><span className="task-priority">{task.priority} priority</span></div>;
}
function EventBriefCard({event}:{event:EventRecord}) {
  const b=event.brief;
  return <section id="brief" className="panel dashboard-section wide-section"><SectionTitle number="06" title="The details behind the day" description="Your original brief, kept alongside your plan."/><div className="brief-grid"><div><h3>Style & preferences</h3><dl>{Object.entries(b.details).filter(([k])=>k!=="category").map(([key,value])=><div key={key}><dt>{key.replace(/([A-Z])/g," $1")}</dt><dd>{String(value)}</dd></div>)}</dl></div><div><h3>Your priorities</h3><div className="tags">{b.priorities.map(p=><span className="pill" key={p}>{p}</span>)}</div><dl><dt>Dietary requirements</dt><dd>{b.dietary||"None specified"}</dd><dt>Accessibility requirements</dt><dd>{b.accessibility||"None specified"}</dd><dt>Special instructions</dt><dd>{b.notes||"None specified"}</dd></dl></div></div></section>;
}
