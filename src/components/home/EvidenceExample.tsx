import { Info } from "lucide-react";
import { ProcessingBadge, DnsSourceBadge } from "./ProcessingBadge";
import styles from "./home.module.css";

export function EvidenceExample({ lang }: { lang: "zh" | "en" }) {
  const zh = lang === "zh";
  return <section className={styles.example} aria-labelledby="evidence-title" aria-describedby="example-notice">
    <h2 id="evidence-title" className={styles.evidenceTitle}>{zh ? "结果来自不同观察位置" : "Know where each observation comes from"}</h2>
    <div className={styles.sourceLine}>
      <div className={styles.locationGroup} role="group" aria-label={zh ? "处理与观察位置" : "Processing and observation locations"}>
        <ProcessingBadge location="local" lang={lang} /><ProcessingBadge location="edge" lang={lang} /><ProcessingBadge location="remote" lang={lang} />
      </div>
      <div className={styles.serviceGroup} role="group" aria-label={zh ? "证据来源服务" : "Evidence source service"}><DnsSourceBadge lang={lang} /></div>
    </div>
    <div className={styles.miniResult}>
      <p id="example-notice" className={styles.exampleLabel}><Info size={13} aria-hidden="true" />{zh ? "示例 · 非实时数据" : "Example · Not live data"}</p>
      <dl className={styles.flow}>
        <div className={styles.flowStep}><dt>Observed</dt><dd className={styles.evidenceValue}>Edge HTTP 200 · Remote HTTP 403</dd></div>
        <div className={styles.flowStep}><dt>Assessment</dt><dd>{zh ? "不同观察位置结果不一致" : "Observations differ by location"}</dd></div>
        <div className={styles.flowStep}><dt>Next action</dt><dd>{zh ? "从其他网络复核" : "Verify from another network"}</dd></div>
      </dl>
    </div>
  </section>;
}
