"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Sparkles, X } from "lucide-react";
import { sampleDownload } from "@/lib/sample-download";
import type { SamplePlan, SampleProgress } from "@/lib/sample-types";
import { PlanPreview } from "./plan-preview";

export default function SampleDialog({
  plan,
  onClose,
  onStart,
}: {
  plan: SamplePlan;
  onClose: () => void;
  onStart: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState<SampleProgress>({ completed: [], vendors: {} });

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    heading.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    // A modal makes the opener inert until it is closed. Restore focus only after this.
    dialog.current?.close();
    onClose();
  }

  function start() {
    dialog.current?.close();
    onStart();
  }

  function download() {
    const url = URL.createObjectURL(
      new Blob([sampleDownload(plan, progress)], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "eventura-sample-plan.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <dialog
      ref={dialog}
      className="planner-dialog planner-dialog-result"
      aria-labelledby="planner-heading"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== dialog.current) return;
        const rect = dialog.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
      }}
    >
      <div className="planner-dialog-inner">
        <div className="dialog-top">
          <span className="eyebrow">
            <Sparkles size={14} /> A LITTLE LOOK INSIDE
          </span>
          <button className="icon-button" aria-label="Close event planner" onClick={close}>
            <X size={21} />
          </button>
        </div>
        <h2 ref={heading} tabIndex={-1} id="planner-heading">
          Picture the possibilities.
        </h2>
        <p className="dialog-intro">A clear starting point, with room to make it your own.</p>
        <PlanPreview plan={plan} onProgressChange={setProgress} />
        <p className="result-note">
          An illustrative wedding plan. Try the tabs, checklist, and vendor statuses. Sample changes
          last for this preview; your own events are saved in My events. This sample uses rule-based
          estimates. Your event dashboard offers optional AI assistance.
        </p>
        <div className="form-footer">
          <button className="text-button" onClick={start}>
            <ArrowLeft size={15} />
            Plan my own event
          </button>
          <button className="button button-dark" onClick={download}>
            <Download size={16} />
            Download sample
          </button>
        </div>
      </div>
    </dialog>
  );
}
