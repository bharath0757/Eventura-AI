// @vitest-environment jsdom
import { createElement, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AIAssistant } from "@/components/ai-assistant";
import { eventStore, STORAGE_KEY } from "@/lib/storage/events";
import { localRecommendations, localOptimization, localAnswer } from "@/lib/ai/fallback";
import { optimizeBudget } from "@/lib/ai/optimizer";
import type { AIRequest } from "@/lib/ai/schemas";
import { record } from "./fixtures";
import { AI_LIMITS } from "@/lib/ai/limits";
const fetchMock = vi.fn();
function Harness() { const [event,setEvent]=useState(()=>eventStore().get(record().id)!); return createElement(AIAssistant,{event,onSaved:()=>setEvent(eventStore().get(event.id)!)}); }
function answer(request: AIRequest, source="rule-based") {
  const data=request.operation==="recommendations"?localRecommendations(request):request.operation==="ask"?localAnswer(request):localOptimization(request);
  return {operation:request.operation,source,message:source==="live-ai"?"Live Google Gemini generated this advice.":"Live AI is unavailable. Using rule-based planning.",data,...(request.operation==="optimize"?{proposal:optimizeBudget(request,(data as ReturnType<typeof localOptimization>).guidance)}:{})};
}
function mockResponses(source="rule-based") { fetchMock.mockImplementation(async (_:string,init:RequestInit)=>({ok:true,json:async()=>answer(JSON.parse(String(init.body)),source)})); }
beforeEach(()=>{ localStorage.clear();eventStore().save(record());fetchMock.mockReset();vi.stubGlobal("fetch",fetchMock);mockResponses(); });
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
const click=(name:string)=>fireEvent.click(screen.getByRole("button",{name}));
async function preview(){click("Optimize My Budget");fireEvent.change(screen.getByLabelText("Target budget (INR)"),{target:{value:"12001"}});click("Preview budget proposal");await screen.findByText("Review your proposed budget");}
describe("assistant interaction and persistence",()=>{
  it("waits through the provider window and safely bounds an unresponsive request", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    const before = localStorage.getItem(STORAGE_KEY);
    render(createElement(Harness)); click("Generate personalized ideas");
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    await act(async () => { await vi.advanceTimersByTimeAsync(AI_LIMITS.timeoutMs); });
    expect(signal.aborted).toBe(false); expect(screen.getByRole("button", { name: "Cancel request" })).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(AI_LIMITS.requestTimeoutMs - AI_LIMITS.timeoutMs + 1); });
    expect(signal.aborted).toBe(true); expect(screen.getByRole("alert").textContent).toContain("saved event is unchanged");
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });
  it("does not call the provider on mount",()=>{render(createElement(Harness));expect(fetchMock).not.toHaveBeenCalled();expect(screen.getByText(/sent to Google Gemini/)).toBeTruthy();});
  it.each(["rule-based","live-ai"])("displays honest %s recommendations and saves once",async source=>{
    mockResponses(source);render(createElement(Harness));click("Generate personalized ideas");await screen.findByText(/Practical next steps for/);
    expect(screen.getAllByText(source==="live-ai"?"AI-generated · Live Gemini":"Rule-based fallback").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button",{name:"Keep this idea"})[0]);expect(eventStore().get(record().id)?.savedIdeas).toHaveLength(1);
    expect((screen.getByRole("button",{name:"Saved to your event"}) as HTMLButtonElement).disabled).toBe(true);
  });
  it("blocks duplicate submission during a pending request",async()=>{
    let resolve!: (value:unknown)=>void;fetchMock.mockImplementation(()=>new Promise(r=>{resolve=r;}));render(createElement(Harness));const button=screen.getByRole("button",{name:"Generate personalized ideas"});fireEvent.click(button);fireEvent.click(button);expect(fetchMock).toHaveBeenCalledTimes(1);
    const r:AIRequest={operation:"recommendations",brief:record().brief,plan:record().plan};resolve({ok:true,json:async()=>answer(r)});await screen.findByText(/Practical next steps/);
  });
  it("failed requests preserve the dashboard and expose deliberate retry",async()=>{fetchMock.mockRejectedValue(new Error("Connection unavailable"));render(createElement(Harness));click("Generate personalized ideas");await screen.findByRole("alert");expect(screen.getByRole("button",{name:"Try again"})).toBeTruthy();expect(eventStore().get(record().id)?.brief.budget).toBe(15001);});
  it("answers bounded questions without changing the event",async()=>{render(createElement(Harness));click("Ask Eventura AI");expect((screen.getByRole("button",{name:"Ask about my event"}) as HTMLButtonElement).disabled).toBe(true);const input=screen.getByLabelText("What would you like help with?");expect(input.getAttribute("maxlength")).toBe("1000");fireEvent.change(input,{target:{value:"Vegetarian catering?"}});const before=localStorage.getItem(STORAGE_KEY);click("Ask about my event");await screen.findByText("Your question");expect(screen.getByText("Vegetarian catering?",{selector:"p"})).toBeTruthy();expect(localStorage.getItem(STORAGE_KEY)).toBe(before);});
  it("rejecting preview leaves original saved bytes untouched",async()=>{render(createElement(Harness));const before=localStorage.getItem(STORAGE_KEY);await preview();expect(localStorage.getItem(STORAGE_KEY)).toBe(before);click("Reject proposal");expect(localStorage.getItem(STORAGE_KEY)).toBe(before);expect(screen.getByText(/Proposal discarded/)).toBeTruthy();});
  it("requires confirmation and persists accepted budget with task progress",async()=>{
    const r=record();eventStore().setTaskStatus(r.id,"timeline",r.plan.timeline[0].id,"completed");render(createElement(Harness));await preview();expect((screen.getByRole("button",{name:"Confirm and save budget"}) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/I have reviewed/));click("Confirm and save budget");expect(eventStore().get(r.id)?.brief.budget).toBe(12001);expect(eventStore().get(r.id)?.plan.timeline[0].status).toBe("completed");expect(screen.getByText(/Budget saved/)).toBeTruthy();
  });
  it("failed persistence never shows success or replaces old budget",async()=>{
    render(createElement(Harness));await preview();const before=localStorage.getItem(STORAGE_KEY);vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("quota");});fireEvent.click(screen.getByLabelText(/I have reviewed/));click("Confirm and save budget");expect(screen.getByRole("alert").textContent).toContain("could not be saved");expect(screen.queryByText(/Budget saved/)).toBeNull();expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });
  it("rejects malformed server output without rendering a broken comparison",async()=>{fetchMock.mockResolvedValue({ok:true,json:async()=>({source:"live-ai",operation:"optimize",proposal:{}})});render(createElement(Harness));click("Generate personalized ideas");await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("could not be verified"));});
});
