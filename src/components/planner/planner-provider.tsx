"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { EventCategory } from "@/types";
import type { SamplePlan } from "@/lib/sample-types";

const SampleDialog = dynamic(() => import("./sample-dialog"), {
  ssr: false,
  loading: () => (
    <p className="sr-only" role="status">
      Opening the sample plan…
    </p>
  ),
});

interface PlannerContextValue {
  startPlanning: (category?: EventCategory) => void;
  viewSample: () => void;
  openSavedPlan: () => void;
}
const PlannerContext = createContext<PlannerContextValue | null>(null);

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used within PlannerProvider");
  return context;
}

export function PlannerProvider({ children, sample }: { children: ReactNode; sample: SamplePlan }) {
  const router = useRouter();
  const [sampleOpen, setSampleOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const closeSample = useCallback(() => {
    setSampleOpen(false);
    opener.current?.focus();
  }, []);
  const startPlanning = useCallback(
    (category: EventCategory = "wedding") => {
      setSampleOpen(false);
      router.push("/events/new?category=" + encodeURIComponent(category));
    },
    [router],
  );
  const viewSample = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSampleOpen(true);
  }, []);
  const openSavedPlan = useCallback(() => router.push("/events"), [router]);
  const value = useMemo(
    () => ({ startPlanning, viewSample, openSavedPlan }),
    [startPlanning, viewSample, openSavedPlan],
  );

  return (
    <PlannerContext.Provider value={value}>
      {children}
      {sampleOpen ? (
        <SampleDialog plan={sample} onClose={closeSample} onStart={startPlanning} />
      ) : null}
    </PlannerContext.Provider>
  );
}
