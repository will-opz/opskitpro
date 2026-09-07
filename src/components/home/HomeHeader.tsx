"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./home.module.css";

export type HomeSearchItem = { title: string; href: string; keywords: string };
export function HomeHeader({ lang, tools }: { lang: "en" | "zh"; tools: HomeSearchItem[] }) {
  const zh = lang === "zh";
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const openSearch = () => { dialog.current?.showModal(); input.current?.focus(); };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dialog.current?.showModal(); input.current?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  const nav = [
    ["/tools/website-check", zh ? "诊断" : "Diagnose"],
    ["/tools", zh ? "工具" : "Tools"],
    ["/tools/docs", zh ? "文档" : "Docs"],
    ["#automate", "API / MCP"],
  ];
  const links = nav.map(([href, title]) => <Link key={href} href={href.startsWith("#") ? href : `/${lang}${href}`} onClick={() => { if (menu.current) menu.current.open = false; }}>{title}</Link>);
  const normalizedQuery = query.trim().toLowerCase();
  const results = tools.filter((tool) => `${tool.title} ${tool.keywords}`.toLowerCase().includes(normalizedQuery));
  return <header className={styles.header}>
    <a className={styles.skip} href="#home-main">{zh ? "跳至主要内容" : "Skip to content"}</a>
    <div className={`${styles.container} ${styles.headerInner}`}>
      <Link href={`/${lang}`} className={styles.brand} aria-label="OpsKitPro">
        <Image src="/logo.svg" width={32} height={32} alt="" /><span>OpsKit<span>Pro_</span></span>
      </Link>
      <nav className={styles.nav} aria-label={zh ? "主导航" : "Main navigation"}>{links}</nav>
      <div className={styles.controls}>
        <button ref={trigger} className={styles.searchButton} onClick={openSearch} type="button" aria-label={zh ? "搜索工具" : "Search tools"} aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K"><Search size={17} aria-hidden="true" /><span>{zh ? "搜索" : "Search"}</span><kbd>⌘K</kbd></button>
        <div className={styles.language}><LanguageToggle currentLang={lang} /></div>
        <ThemeToggle />
        <details className={styles.mobileMenu} ref={menu} onKeyDown={(event) => { if (event.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}>
          <summary aria-label={zh ? "导航菜单" : "Navigation menu"}><Menu size={21} aria-hidden="true" /></summary>
          <nav className={styles.mobileNav} aria-label={zh ? "移动导航" : "Mobile navigation"}>{links}<LanguageToggle currentLang={lang} /></nav>
        </details>
      </div>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="home-search-title" onClose={() => trigger.current?.focus()}>
      <div className={styles.dialogHeader}><h2 id="home-search-title">{zh ? "查找工具" : "Find a tool"}</h2><button type="button" aria-label={zh ? "关闭搜索" : "Close search"} onClick={() => dialog.current?.close()}><X size={18} /></button></div>
      <div className={styles.dialogSearch}><label htmlFor="home-tool-query" className="sr-only">{zh ? "工具名称或任务" : "Tool or task"}</label><input ref={input} id="home-tool-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={zh ? "例如 DNS、SSL、JSON…" : "Try DNS, SSL, JSON…"} autoComplete="off" spellCheck={false} /></div>
      <div className={styles.searchResults}>
        {results.map((tool) => <Link key={tool.href} href={tool.href} onClick={() => dialog.current?.close()}>{tool.title}<ArrowRight size={15} aria-hidden="true" /></Link>)}
        {!results.length && <p role="status">{zh ? "没有匹配的工具。试试 DNS、JSON 或 Hash。" : "No matching tools. Try DNS, JSON or Hash."}</p>}
      </div>
    </dialog>
  </header>;
}
