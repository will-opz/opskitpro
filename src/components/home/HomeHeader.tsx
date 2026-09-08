"use client";
import { SiteHeader } from "@/components/SiteHeader";

/** Compatibility entry point; all public pages render the same navigation. */
export function HomeHeader({lang}: {lang:"en"|"zh"}) {
  return <SiteHeader lang={lang} />;
}
