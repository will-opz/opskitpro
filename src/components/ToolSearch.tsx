"use client";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { searchTools } from "@/lib/tool-search";
import type { ProductLocale } from "@/lib/tool-catalog";
import styles from "./home/home.module.css";

/** One palette and one search index shared by the home and site headers. */
export function ToolSearch({lang}: {lang:ProductLocale}) {
  const zh = lang === "zh";
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [query,setQuery] = useState("");
  const results = searchTools(query,{lang});
  const open = () => {
    returnFocus.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : trigger.current;
    dialog.current?.showModal(); input.current?.focus();
  };
  useEffect(()=>{
    const keydown = (event:KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.isComposing) {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close(); else open();
      }
    };
    document.addEventListener("keydown",keydown);
    return ()=>document.removeEventListener("keydown",keydown);
  },[]);
  const keyboard = (event:ReactKeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    const links = Array.from(dialog.current?.querySelectorAll<HTMLAnchorElement>('[data-search-tool]') ?? []);
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "ArrowDown") { event.preventDefault(); links[Math.min(index+1,links.length-1)]?.focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); if(index<=0) input.current?.focus(); else links[index-1]?.focus(); }
    if (event.key === "Enter" && event.target === input.current && links.length) { event.preventDefault(); links[0].click(); }
  };
  return <>
    <button ref={trigger} className={styles.searchButton} onClick={open} type="button" aria-label={zh ? "搜索工具" : "Search tools"} aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K"><Search size={17} aria-hidden="true" /><span>{zh ? "搜索" : "Search"}</span><kbd>⌘K</kbd></button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="tool-search-dialog-title" onKeyDown={keyboard} onClose={()=>returnFocus.current?.focus()}>
      <div className={styles.dialogHeader}><h2 id="tool-search-dialog-title">{zh ? "查找工具" : "Find a tool"}</h2><button type="button" aria-label={zh ? "关闭搜索" : "Close search"} onClick={()=>dialog.current?.close()}><X size={18} /></button></div>
      <div className={styles.dialogSearch}><label htmlFor="palette-tool-query" className="sr-only">{zh ? "工具名称或任务" : "Tool or task"}</label><input ref={input} id="palette-tool-query" value={query} onChange={event=>setQuery(event.target.value)} placeholder={zh ? "例如 DNS、SSL、JSON…" : "Try DNS, SSL, JSON…"} autoComplete="off" spellCheck={false} /></div>
      <div className={styles.searchResults}>
        {results.map(({tool,note})=><Link data-search-tool={tool.id} key={tool.id} href={`/${lang}${tool.href}`} onClick={()=>dialog.current?.close()}><span>{tool.title[lang]}{note && <small className="mt-1 block text-xs text-[var(--text-secondary)]">{note}</small>}</span><ArrowRight size={15} aria-hidden="true" /></Link>)}
        {!results.length && <p role="status">{zh ? "没有匹配的工具。试试 DNS、JSON 或 Hash。" : "No matching tools. Try DNS, JSON or Hash."}</p>}
      </div>
    </dialog>
  </>;
}
