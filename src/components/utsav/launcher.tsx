"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UTSAV_OPEN } from "./events";
import "./launcher.css";
const Panel = dynamic(() => import("./panel"), {
  ssr: false,
  loading: () => (
    <p className="utsav-opening" role="status">
      Opening Utsav…
    </p>
  ),
});
export function UtsavLauncher() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const routeEventId = /^\/events\/([0-9a-f-]{36})$/.exec(path)?.[1];
  useEffect(() => {
    const show = () => setOpen(true);
    const hash = () => {
      if (window.location.hash === "#assistant") show();
    };
    window.addEventListener(UTSAV_OPEN, show);
    window.addEventListener("hashchange", hash);
    hash();
    return () => {
      window.removeEventListener(UTSAV_OPEN, show);
      window.removeEventListener("hashchange", hash);
    };
  }, []);
  function close() {
    setOpen(false);
    requestAnimationFrame(() => button.current?.focus());
  }
  return (
    <>
      <button
        ref={button}
        type="button"
        className="utsav-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open Utsav, your celebration companion"
        aria-expanded={open}
        aria-controls={open ? "utsav-dialog" : undefined}
      >
        <svg viewBox="0 0 64 64" width="43" height="43" fill="none" aria-hidden="true">
          <ellipse cx="17" cy="29" rx="13" ry="18" fill="#dfcdb3" />
          <ellipse cx="46" cy="29" rx="13" ry="18" fill="#dfcdb3" />
          <ellipse cx="32" cy="30" rx="17" ry="22" fill="#fff1dc" />
          <path
            d="M33 32c-1 19 1 25 10 24 8-1 11-7 9-12"
            stroke="#fff1dc"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="25" cy="28" r="3" fill="#35291f" />
          <circle cx="40" cy="28" r="3" fill="#35291f" />
          <circle cx="24" cy="27" r="1" fill="white" />
          <circle cx="39" cy="27" r="1" fill="white" />
          <path d="M24 9q8-5 16 0" stroke="#d9a24b" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="utsav-launcher-label">Utsav</span>
      </button>
      {open ? <Panel routeEventId={routeEventId} onClose={close} /> : null}
    </>
  );
}
