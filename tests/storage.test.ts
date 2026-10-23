import { beforeEach,describe,expect,it } from "vitest";
import { eventStore,STORAGE_KEY,type StoragePort } from "@/lib/storage/events";
import { recordSchema } from "@/lib/validation/schemas";
import { record,ids } from "./fixtures";
class MemoryStorage implements StoragePort {
  data=new Map<string,string>();blockedRead=false;blockedWrite=false;
  getItem(k:string){if(this.blockedRead)throw new Error("blocked");return this.data.get(k)??null;}
  setItem(k:string,v:string){if(this.blockedWrite)throw new Error("quota");this.data.set(k,v);}
}
let memory:MemoryStorage;
beforeEach(()=>{memory=new MemoryStorage();});
describe("local event persistence",()=>{
  const store=()=>eventStore(memory,()=>"2026-10-23T13:00:00.000Z");
  it("starts empty and returns null for missing IDs",()=>{expect(store().list().events).toEqual([]);expect(store().get(ids[0])).toBeNull();});
  it("saves and retrieves a valid event",()=>{const r=record();store().save(r);expect(store().get(r.id)).toEqual(r);});
  it("lists multiple events",()=>{store().save(record("wedding",ids[0]));store().save(record("birthday",ids[1]));store().save(record("community",ids[2]));expect(store().list().events).toHaveLength(3);});
  it("prevents duplicate record IDs",()=>{store().save(record());expect(()=>store().save(record())).toThrow("already exists");expect(store().list().events).toHaveLength(1);});
  it("updates a record and timestamp without changing identity",()=>{const r=record();store().save(r);const updated=store().update(r.id,e=>({...e,brief:{...e.brief,name:"Updated name"}}));expect(updated.brief.name).toBe("Updated name");expect(updated.createdAt).toBe(r.createdAt);expect(updated.updatedAt).toBe("2026-10-23T13:00:00.000Z");expect(store().get(r.id)).toEqual(updated);});
  it("persists checklist and timeline status across fresh store instances",()=>{const r=record();store().save(r);store().setTaskStatus(r.id,"vendors",r.plan.vendors[0].id,"in-progress");store().setTaskStatus(r.id,"timeline",r.plan.timeline[0].id,"completed");expect(store().get(r.id)?.plan.vendors[0].status).toBe("in-progress");expect(store().get(r.id)?.plan.timeline[0].status).toBe("completed");});
  it("deletes only the selected event",()=>{store().save(record());store().save(record("birthday",ids[1]));store().remove(ids[0]);expect(store().get(ids[0])).toBeNull();expect(store().get(ids[1])).not.toBeNull();});
  it("rejects updates and deletion for missing events",()=>{expect(()=>store().update(ids[0],r=>r)).toThrow("could not be found");expect(()=>store().remove(ids[0])).toThrow("could not be found");});
  it("rejects missing task IDs",()=>{store().save(record());expect(()=>store().setTaskStatus(ids[0],"vendors","unknown","completed")).toThrow("task could not be found");});
  it("preserves malformed JSON and refuses to overwrite it",()=>{memory.setItem(STORAGE_KEY,"{broken");expect(()=>store().list()).toThrow("unreadable");expect(()=>store().save(record())).toThrow();expect(memory.getItem(STORAGE_KEY)).toBe("{broken");});
  it("preserves unknown versions",()=>{const content=JSON.stringify({version:9,events:[]});memory.setItem(STORAGE_KEY,content);expect(()=>store().save(record())).toThrow("unsupported");expect(memory.getItem(STORAGE_KEY)).toBe(content);});
  it("recovers valid records individually and preserves invalid raw data on save",()=>{const corrupt={id:"broken",schemaVersion:0};memory.setItem(STORAGE_KEY,JSON.stringify({version:1,events:[record(),corrupt]}));expect(store().list().events).toHaveLength(1);expect(store().list().warnings).toHaveLength(1);store().save(record("birthday",ids[1]));expect(JSON.parse(memory.getItem(STORAGE_KEY)!).events).toContainEqual(corrupt);expect(store().list().events).toHaveLength(2);});
  it("reports duplicate stored IDs without losing the valid record",()=>{memory.setItem(STORAGE_KEY,JSON.stringify({version:1,events:[record(),record()]}));expect(store().list().events).toHaveLength(1);expect(store().list().warnings).toHaveLength(1);});
  it("handles unavailable storage and server rendering safely",()=>{expect(()=>eventStore().list()).toThrow("unavailable");});
  it("handles read errors",()=>{memory.blockedRead=true;expect(()=>store().list()).toThrow("could not be read");});
  it("does not claim a failed save succeeded",()=>{memory.blockedWrite=true;expect(()=>store().save(record())).toThrow("could not be saved");expect(memory.getItem(STORAGE_KEY)).toBeNull();});
  it("preserves existing data when an update fails",()=>{const r=record();store().save(r);const before=memory.getItem(STORAGE_KEY);memory.blockedWrite=true;expect(()=>store().setTaskStatus(r.id,"vendors",r.plan.vendors[0].id,"completed")).toThrow();expect(memory.getItem(STORAGE_KEY)).toBe(before);});
  it("revalidates records on save and update",()=>{const r=record();r.plan.budget[0].amount++;expect(()=>store().save(r)).toThrow();store().save(record());expect(()=>store().update(ids[0],e=>({...e,brief:{...e.brief,budget:999}}))).toThrow();});
  it("keeps every stored valid record compatible with the schema",()=>{store().save(record());store().setTaskStatus(ids[0],"vendors",record().plan.vendors[0].id,"completed");expect(store().list().events.every(e=>recordSchema.safeParse(e).success)).toBe(true);});
});
