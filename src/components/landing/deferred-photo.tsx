"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Native lazy loading can fetch whole sections before their photos are useful. */
export function DeferredPhoto({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    if (anchor.current) observer.observe(anchor.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <span ref={anchor} style={{ position: "absolute", inset: 0 }}>
        {visible ? children : null}
      </span>
      <noscript>{children}</noscript>
    </>
  );
}
