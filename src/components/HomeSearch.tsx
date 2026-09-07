"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { parseWebsiteTarget } from "@/lib/diagnostic-target";
import styles from "./home/home.module.css";

export default function HomeSearch({ lang }: { lang: "zh" | "en" }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const id = useId();
  const zh = lang === "zh";
  return <div className={styles.workspace}>
    <form className={styles.form} aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      const target = parseWebsiteTarget(query);
      if (!target) { setError(true); return; }
      startTransition(() => router.push(`/${lang}/tools/website-check?q=${encodeURIComponent(target)}`));
    }}>
      <label htmlFor={id}>{zh ? "域名或 URL" : "Domain or URL"}</label>
      <div className={styles.inputRow}>
        <input id={id} type="text" required value={query} disabled={pending}
          onChange={(event) => { setQuery(event.target.value); setError(false); }}
          placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off"
          aria-invalid={error || undefined} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} />
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? zh ? "正在打开诊断…" : "Opening diagnostic…" : zh ? "开始诊断" : "Run diagnostic"}<ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{zh ? "请输入有效域名或 HTTP(S) URL，例如 example.com。" : "Enter a valid domain or HTTP(S) URL, such as example.com."}</p>}
    </form>
    <div className={styles.privacyLine}>
      <span id={`${id}-hint`}>{zh ? "域名会发送至诊断服务；URL 路径、参数与登录信息不发送。" : "The hostname is sent for diagnosis. URL paths, parameters and credentials are omitted."}</span>
      <details><summary>{zh ? "查看数据路径" : "View data path"}</summary>
        <div className={styles.pathDetails}>
          {zh ? "仅发送目标域名：OpsKitPro 服务端探针（可能启用边缘复核）；DNS 接收方为 Google、Cloudflare、阿里公共解析器。" : "Only the target hostname is sent: to the OpsKitPro server probe (with optional edge corroboration), and to Google, Cloudflare and Ali public DNS resolvers."}{" "}
          <Link href={`/${lang}/tools/docs#website-check`}>{zh ? "处理方式与限制" : "Processing and limits"}</Link>
        </div>
      </details>
    </div>
  </div>;
}
