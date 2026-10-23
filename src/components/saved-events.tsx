"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Users, Trash2, Heart, Cake, HandHeart } from "lucide-react";
import { categoryLabels } from "@/lib/config";
import { money, formatDate } from "@/lib/dates";
import { eventStore } from "@/lib/storage/events";
import { useEvents } from "./use-events";
import { ActionLink, Button, EmptyState, Notice, PageHeading } from "./ui";
export function SavedEvents() {
  const {snapshot,error,reload}=useEvents();
  const [selected,setSelected]=useState<{id:string;name:string}|null>(null);
  const [deleteError,setDeleteError]=useState("");
  const dialog=useRef<HTMLDialogElement>(null);
  const icons={wedding:Heart,birthday:Cake,community:HandHeart};
  function remove() {
    if(!selected)return;
    try {eventStore().remove(selected.id);reload();dialog.current?.close();setSelected(null);setDeleteError("");}
    catch(e){setDeleteError(e instanceof Error?e.message:"The event could not be deleted.");}
  }
  return <div className="container page saved-page"><PageHeading eyebrow="A little closer to the big day" title="Your occasions, all together." description="Pick up where you left off. Every plan is saved in this browser." action={<ActionLink href="/events/new">Create an event</ActionLink>}/>
    <Notice tone="info">Browser-local plans are not synchronized between devices. Clearing this site’s browser data removes saved events.</Notice>
    {error?<Notice>{error} <button className="text-link" onClick={reload}>Try again</button></Notice>:null}
    {snapshot?.warnings.map((w,i)=><Notice key={i} tone="info">{w}</Notice>)}
    {!snapshot&&!error?<p className="loading-state" role="status">Opening your saved plans…</p>:null}
    {snapshot?.events.length===0?<EmptyState title="Your next occasion starts here." description="Create a wedding, birthday or community event. We’ll help you turn the details into a practical plan."/>:null}
    {snapshot&&snapshot.events.length>0?<div className="saved-grid">{snapshot.events.map(event=>{
      const Icon=icons[event.brief.category],tasks=[...event.plan.timeline,...event.plan.vendors],completed=tasks.filter(t=>t.status==="completed").length;
      return <article className="saved-card panel" key={event.id}><div className="saved-card-top"><span className={`saved-icon ${event.brief.category}`}><Icon size={23}/></span><span className="pill">{categoryLabels[event.brief.category]}</span><button className="icon-button" type="button" aria-label={`Delete ${event.brief.name}`} onClick={()=>{setSelected({id:event.id,name:event.brief.name});setDeleteError("");dialog.current?.showModal();}}><Trash2 size={17}/></button></div>
        <Link href={`/events/${event.id}`} className="event-name-link"><h2>{event.brief.name}</h2></Link><div className="event-meta"><span><CalendarDays size={15}/>{formatDate(event.brief.date)}</span><span><MapPin size={15}/>{event.brief.location}</span><span><Users size={15}/>{event.brief.guests} guests</span></div>
        <div className="saved-budget"><span>Total budget</span><strong>{money(event.brief.budget)}</strong></div><div className="progress-label"><span>Planning progress</span><span>{completed}/{tasks.length} tasks</span></div><progress value={completed} max={tasks.length} aria-label="Planning progress"/>
        <Link className="card-open" href={`/events/${event.id}`}>Continue planning <ArrowUpRight size={18}/></Link>
      </article>;
    })}</div>:null}
    <dialog ref={dialog} className="delete-dialog" onCancel={()=>setSelected(null)} aria-labelledby="delete-title"><span className="dialog-icon"><Trash2 size={22}/></span><h2 id="delete-title">Delete this event?</h2><p>“{selected?.name}” and its planning progress will be removed from this browser. This cannot be undone.</p>{deleteError?<Notice>{deleteError}</Notice>:null}<div className="dialog-actions"><Button className="secondary" onClick={()=>{dialog.current?.close();setSelected(null);}}>Keep event</Button><Button className="danger" onClick={remove}>Delete event</Button></div></dialog>
  </div>;
}
