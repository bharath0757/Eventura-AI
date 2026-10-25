import type { EventRecord, TaskStatus } from "@/types";
import { recordSchema, statusSchema } from "@/lib/validation/schemas";
import { applyProposal, type BudgetProposal } from "@/lib/ai/optimizer";
import { recommendationSchema, sourceSchema, type Recommendation, type Source } from "@/lib/ai/contracts";
export const STORAGE_KEY="eventura-ai:v1:events";
export interface StoragePort {getItem(key:string):string|null;setItem(key:string,value:string):void}
export interface EventSnapshot {events:EventRecord[];warnings:string[]}
interface ReadResult extends EventSnapshot {raw:unknown[]}
export class StorageError extends Error {}
function browserStorage():StoragePort {
  try {
    if(typeof window==="undefined") throw new Error();
    return window.localStorage;
  } catch {throw new StorageError("Browser storage is unavailable. Enable site storage and try again.");}
}
function recordId(value:unknown):unknown {
  return typeof value==="object"&&value!==null&&"id" in value?value.id:undefined;
}
export function eventStore(storage?:StoragePort,clock=()=>new Date().toISOString()) {
  const port=()=>storage??browserStorage();
  function read():ReadResult {
    let content:string|null;
    try {content=port().getItem(STORAGE_KEY);} catch(e) {throw e instanceof StorageError?e:new StorageError("Saved events could not be read. Check browser storage permissions.");}
    if(content===null) return {raw:[],events:[],warnings:[]};
    let data:unknown;
    try {data=JSON.parse(content);} catch {throw new StorageError("Saved data is unreadable. It has been preserved; no events were overwritten.");}
    if(typeof data!=="object"||data===null||!("version" in data)||data.version!==1||!("events" in data)||!Array.isArray(data.events))
      throw new StorageError("This saved-data format is unsupported. It has been preserved.");
    const events:EventRecord[]=[],warnings:string[]=[],seen=new Set<string>();
    for(const raw of data.events) {
      const result=recordSchema.safeParse(raw);
      if(!result.success||seen.has(result.data.id)) {warnings.push("An invalid or duplicate saved event was hidden. Its original data has been preserved.");continue;}
      seen.add(result.data.id); events.push(result.data);
    }
    return {raw:data.events,events,warnings};
  }
  function write(raw:unknown[]) {
    try {port().setItem(STORAGE_KEY,JSON.stringify({version:1,events:raw}));}
    catch {throw new StorageError("Your changes could not be saved. Storage may be full or blocked. Your existing saved data has not been replaced.");}
  }
  function get(id:string) {return read().events.find(e=>e.id===id)??null;}
  function save(input:EventRecord) {
    const record=recordSchema.parse(input), snapshot=read();
    if(snapshot.raw.some(e=>recordId(e)===record.id)) throw new StorageError("An event with this ID already exists.");
    write([...snapshot.raw,record]); return record;
  }
  function update(id:string,change:(record:EventRecord)=>EventRecord) {
    const snapshot=read(), existing=snapshot.events.find(e=>e.id===id);
    if(!existing) throw new StorageError("This event could not be found.");
    const changed=change(existing);
    const record=recordSchema.parse({...changed,id:existing.id,createdAt:existing.createdAt,updatedAt:clock()});
    // Preserve unknown/corrupt entries rather than silently discarding them during a valid update.
    write(snapshot.raw.map(e=>recordId(e)===id?record:e)); return record;
  }
  return {
    list():EventSnapshot {const {events,warnings}=read();return {events:[...events].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),warnings};},
    get,save,update,
    acceptProposal(id:string,proposal:BudgetProposal) { return update(id,r=>applyProposal(r,proposal)); },
    retainIdea(id:string,input:Recommendation,mode:Source) {
      const idea=recommendationSchema.parse(input),source=sourceSchema.parse(mode);
      return update(id,r=>{
        if(!r.plan.budget.some(b=>b.category===idea.category)) throw new StorageError("This idea references an unknown budget category.");
        const saved=r.savedIdeas??[];
        if(saved.some(s=>s.idea.category===idea.category&&s.idea.title.toLowerCase()===idea.title.toLowerCase())) return r;
        if(saved.length>=30) throw new StorageError("You can retain up to 30 assistant ideas per event.");
        return {...r,savedIdeas:[...saved,{idea,source,savedAt:clock()}]};
      });
    },
    remove(id:string) {const snapshot=read();if(!snapshot.events.some(e=>e.id===id))throw new StorageError("This event could not be found.");write(snapshot.raw.filter(e=>recordId(e)!==id));},
    setTaskStatus(id:string,section:"timeline"|"vendors",taskId:string,status:TaskStatus) {
      const checked=statusSchema.parse(status);
      return update(id,r=>{
        if(!r.plan[section].some(t=>t.id===taskId))throw new StorageError("This task could not be found.");
        return {...r,plan:{...r.plan,[section]:r.plan[section].map(t=>t.id===taskId?{...t,status:checked}:t)}};
      });
    }
  };
}
