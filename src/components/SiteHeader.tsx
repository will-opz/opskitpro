"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToolSearch } from "@/components/ToolSearch";
import styles from "./home/home.module.css";

export function SiteHeader({ lang }: { dict?: unknown; lang: "en" | "zh" }) {
  const zh = lang === "zh";
  const pathname = usePathname() || `/${lang}`;
  const path = pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
  const diagnosticPaths = ["/tools/website-check", "/tools/network-check", "/tools/dns-lookup", "/tools/ip-lookup", "/tools/cloudflare-trace"];
  const active = path === "/tools/docs" ? "/tools/docs" : path === "/mcp" || path === "/tools/api" ? "#automate" : diagnosticPaths.includes(path) ? "/tools/website-check" : path.startsWith("/tools") ? "/tools" : null;
  const menu = useRef<HTMLDetailsElement>(null);
  const nav = [
    ["/tools/website-check", zh ? "诊断" : "Diagnose"],
    ["/tools", zh ? "工具" : "Tools"],
    ["/tools/docs", zh ? "文档" : "Docs"],
    ["#automate", "API / MCP"],
  ];
  const links = nav.map(([href, title]) => <Link key={href} href={href.startsWith("#") ? (path === "/" ? href : `/${lang}${href}`) : `/${lang}${href}`} aria-current={active === href ? "page" : undefined} onClick={() => { if (menu.current) menu.current.open = false; }}>{title}</Link>);
  return <header className={styles.header}>
    <a className={styles.skip} href={path === "/" ? "#home-main" : "#main-content"} onClick={(event)=>{
      const main = document.querySelector("main");
      if (main) {event.preventDefault(); if (!main.hasAttribute("tabindex")) main.tabIndex = -1; main.focus();}
    }}>{zh ? "跳至主要内容" : "Skip to content"}</a>
    <div className={`${styles.container} ${styles.headerInner}`}>
      <Link href={`/${lang}`} className={styles.brand} aria-label="OpsKitPro">
        <Image src="/logo.svg" width={32} height={32} alt="" /><span>OpsKit<span>Pro_</span></span>
      </Link>
      <nav className={styles.nav} aria-label={zh ? "主导航" : "Main navigation"}>{links}</nav>
      <div className={styles.controls}>
        <ToolSearch lang={lang} />
        <div className={styles.language}><LanguageToggle currentLang={lang} /></div>
        <ThemeToggle />
        <details className={styles.mobileMenu} ref={menu} onKeyDown={(event) => { if (event.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}>
          <summary aria-label={zh ? "导航菜单" : "Navigation menu"}><Menu size={21} aria-hidden="true" /></summary>
          <nav className={styles.mobileNav} aria-label={zh ? "移动导航" : "Mobile navigation"}>{links}<LanguageToggle currentLang={lang} /></nav>
        </details>
      </div>
    </div>

  </header>;
}
