"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { observePage } from "@/lib/audience-client";
export function AudiencePageView() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    const observe = () => {
      if (document.visibilityState !== "visible" || last.current === pathname) return;
      last.current = pathname;
      observePage(pathname);
    };
    observe();
    document.addEventListener("visibilitychange", observe);
    const restored = (e: PageTransitionEvent) => { if (e.persisted) { last.current = null; observe(); } };
    window.addEventListener("pageshow", restored);
    return () => { document.removeEventListener("visibilitychange", observe); window.removeEventListener("pageshow", restored); };
  }, [pathname]);
  return null;
}
