"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, Eraser, XCircle } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import {
  JWT_TEXT_LIMIT,
  analyzeJwt,
  formatNumericDate,
  isJwtObject,
  type JwtAnalysis,
  verifyJwtSignature,
} from "./jwt-engine";

type Lang = "en" | "zh";

type CopyText = {
  eyebrow: string;
  title: string;
  subtitle: string;
  privacy: string;
  input: string;
  placeholder: string;
  secret: string;
  secretPlaceholder: string;
  verify: string;
  clear: string;
  noInput: string;
  verifying: string;
  resultLocal: string;
  decodeInfo: string;
  risks: string;
  claims: string;
  verification: string;
  signature: string;
  noneWarning: string;
  notProvided: string;
  parse: string;
  copy: string;
  copied: string;
  copyFailed: string;
  valid: string;
  invalid: string;
  copyHeaders: string;
  copyAll: string;
  copyPayload: string;
  copyToken: string;
  malformed: string;
  unknown: string;
  unsigned: string;
  examples: string[];
};

const Copy: Record<Lang, CopyText> = {
  en: {
    eyebrow: "Local security tool",
    title: "JWT Decoder & Verifier",
    subtitle: "Decode JWT header and payload in-browser. Verify signatures locally without sending tokens anywhere.",
    privacy: "Local processing · Token and secret never leave this browser",
    input: "JWT token",
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    secret: "HMAC secret (optional)",
    secretPlaceholder: "Paste shared secret to verify HS256/HS384/HS512",
    verify: "Verify signature",
    clear: "Clear",
    noInput: "Enter a JWT to inspect.",
    verifying: "Verifying with Web Crypto…",
    resultLocal: "Parsed result",
    decodeInfo: "Decode details",
    risks: "Risk checks",
    claims: "Important claims",
    verification: "Signature verification",
    signature: "Signature segment",
    noneWarning: "alg=none tokens do not use signatures. Treat as untrusted for authentication.",
    notProvided: "Set secret then click Verify.",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Clipboard failed",
    valid: "Valid",
    invalid: "Invalid",
    copyHeaders: "Copy header JSON",
    copyPayload: "Copy payload JSON",
    copyToken: "Copy token",
    parse: "Parse",
    copyAll: "Copy all claims",
    malformed: "Malformed JWT",
    unknown: "Unknown",
    unsigned: "Unsigned · Untrusted",
    examples: [
      "HS256 example: token with header.payload.signature",
      "alg=none: header + payload with empty signature",
    ],
  },
  zh: {
    eyebrow: "本地安全工具",
    title: "JWT 解码与校验",
    subtitle: "在浏览器内解码 JWT 的 header/payload，并在本地验证签名。",
    privacy: "本地处理 · Token 与密钥不离开当前浏览器",
    input: "JWT 文本",
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    secret: "HMAC 密钥（可选）",
    secretPlaceholder: "填入共享密钥以校验 HS256/HS384/HS512",
    verify: "验证签名",
    clear: "清空",
    noInput: "请先粘贴 JWT。",
    verifying: "正在使用 Web Crypto 验签…",
    resultLocal: "解析结果",
    decodeInfo: "解码信息",
    risks: "风险检测",
    claims: "关键声明",
    verification: "签名校验",
    signature: "签名段",
    noneWarning: "alg=none 不含签名，应视为不可信认证载体。",
    notProvided: "填写密钥后点击验证。",
    copy: "复制",
    copied: "已复制",
    copyFailed: "复制失败",
    valid: "有效",
    invalid: "无效",
    copyHeaders: "复制 Header",
    copyPayload: "复制 Payload",
    copyToken: "复制 Token",
    parse: "解析",
    copyAll: "复制全部声明",
    malformed: "JWT 格式错误",
    unknown: "未知",
    unsigned: "未签名 · 不可信",
    examples: [
      "HS256 示例：header.payload.signature",
      "alg=none 示例：header+payload，签名留空",
    ],
  },
};

function formatVerification(analysis: JwtAnalysis): string {
  if (analysis.verification.state === "ok") return "ok";
  if (analysis.verification.state === "unsigned") return "unsigned";
  if (analysis.verification.state === "mismatch") return "mismatch";
  if (analysis.verification.state === "no-secret") return "no-secret";
  if (analysis.verification.state === "unsupported") return "unsupported";
  if (analysis.verification.state === "error") return "error";
  if (analysis.verification.state === "unchecked") return "unchecked";
  return "unknown";
}

export default function JwtClient({ lang }: { lang: Lang }) {
  const text = Copy[lang];
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [analysis, setAnalysis] = useState<JwtAnalysis>(analyzeJwt("", ""));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [verifying, setVerifying] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);

  const risks = useMemo(() => {
    const items: string[] = [];
    if (analysis.risks.malformed) items.push(`${text.malformed}${analysis.risks.malformedMessage ? `: ${analysis.risks.malformedMessage}` : ""}`);
    if (analysis.risks.hasAlgNone) items.push(text.noneWarning);
    if (analysis.risks.expired) items.push("exp is in the past.");
    if (analysis.risks.notBefore) items.push("nbf is in the future.");
    return items;
  }, [analysis, text]);

  const handleAnalyze = () => {
    setHasAnalysis(Boolean(token.trim()));
    setAnalysis(analyzeJwt(token, secret));
  };

  const verify = async () => {
    if (!hasAnalysis || !analysis.isJwt) return;
    setVerifying(true);
    const result = await verifyJwtSignature(token, secret, analysis.metadata.alg || "HS256");
    setAnalysis((current) => ({
      ...current,
      verification: {
        ...current.verification,
        state: result.ok ? "ok" : "mismatch",
        message: result.message,
      },
    }));
    setVerifying(false);
  };

  const clear = () => {
    setHasAnalysis(false);
    setToken("");
    setSecret("");
    setAnalysis(analyzeJwt("", ""));
  };

  const copyText = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1200);
    }
  };

  const headerJson = useMemo(() => {
    try {
      return JSON.stringify(analysis.parts.header.json, null, 2);
    } catch {
      return "";
    }
  }, [analysis.parts.header.json]);

  const payloadJson = useMemo(() => {
    try {
      return JSON.stringify(analysis.parts.payload.json, null, 2);
    } catch {
      return "";
    }
  }, [analysis.parts.payload.json]);

  const claimsText = useMemo(() => {
    try {
      return JSON.stringify(
        {
          ...(isJwtObject(analysis.parts.header.json) ? analysis.parts.header.json : {}),
          ...(isJwtObject(analysis.parts.payload.json) ? analysis.parts.payload.json : {}),
        },
        null,
        2,
      );
    } catch {
      return "";
    }
  }, [analysis.parts.header.json, analysis.parts.payload.json]);

  return (
    <main className="tool-page">
      <ToolPageHeader title={text.title} description={text.subtitle} processing={text.privacy} />

      <section className="tool-grid">
        <div className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <label htmlFor="jwt-token" className="text-sm font-semibold text-[var(--text-primary)]">{text.input}</label>
          <textarea
            id="jwt-token"
            value={token}
            disabled={verifying}
            onChange={(event) => { setToken(event.target.value); setHasAnalysis(false); }}
            placeholder={text.placeholder}
            maxLength={JWT_TEXT_LIMIT}
            className="mt-2 min-h-44 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm font-mono text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">{hasAnalysis ? analysis.isJwt ? text.decodeInfo : text.malformed : "header.payload.signature"}</p>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">{token.length.toLocaleString()} / {JWT_TEXT_LIMIT.toLocaleString()}</span>
          </div>

          <label htmlFor="jwt-secret" className="mt-4 block text-sm font-semibold text-[var(--text-primary)]">{text.secret}</label>
          <input
            id="jwt-secret"
            type="password"
            value={secret}
            disabled={verifying}
            onChange={(event) => { setSecret(event.target.value); if (hasAnalysis) setAnalysis(analyzeJwt(token, event.target.value)); }}
            placeholder={text.secretPlaceholder}
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleAnalyze} disabled={!token.trim() || verifying} className="ui-button-primary">{text.parse}</button>
            <button type="button" onClick={verify} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/[0.08] px-4 py-2 font-semibold text-[var(--info-text)] transition hover:bg-sky-500/[0.14]" disabled={!hasAnalysis || verifying || !analysis.isJwt || analysis.verification.state === "unsupported" || analysis.verification.state === "no-secret" || analysis.metadata.alg === "NONE"}>{verifying ? text.verifying : text.verify}</button>
            <button type="button" onClick={clear} disabled={verifying} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)]"><Eraser className="h-4 w-4" />{text.clear}</button>
          </div>

          {hasAnalysis && analysis.risks.malformed ? <p className="mt-4 flex items-start gap-2 text-sm text-[var(--danger-text)]"><AlertTriangle className="mt-0.5 h-4 w-4" />{analysis.risks.malformedMessage ?? text.malformed}</p> : null}
          {hasAnalysis && risks.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 text-sm text-[var(--warning-text)]">
              <p className="font-semibold">{text.risks}</p>
              <ul className="mt-2 list-disc pl-4 text-sm">
                {risks.map((risk) => <li key={risk}>{risk}</li>)}
              </ul>
            </div>
          ) : null}

          {hasAnalysis && analysis.isJwt && <div className="mt-4 rounded-xl border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text-primary)]">{text.verification}</p>
            <p className="mt-1">
              {formatVerification(analysis) === "ok" ? <span className="text-[var(--accent-text)]">{text.valid}</span> : formatVerification(analysis) === "unsigned" ? <span className="text-[var(--warning-text)]">{text.unsigned}</span> : formatVerification(analysis) === "mismatch" ? <span className="text-[var(--danger-text)]">{text.invalid}</span> : <span>{analysis.verification.message ?? text.notProvided}</span>}
            </p>
            {analysis.verification.state === "no-secret" ? <p className="mt-2 text-xs text-[var(--warning-text)]">{text.notProvided}</p> : null}
            {analysis.verification.state === "unsupported" ? <p className="mt-2 text-xs text-[var(--warning-text)]">Unsupported algorithm. HS256 / HS384 / HS512 / NONE only.</p> : null}
          </div>}
        </div>

        <div className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{text.resultLocal}</h2>
          {!hasAnalysis ? <p className="tool-empty mt-4">{text.noInput}</p> : !analysis.isJwt ? <p role="status" className="tool-empty mt-4">{text.malformed}</p> : <>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{text.decodeInfo}</p>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Header</p>
              <button type="button" onClick={() => copyText(headerJson)} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]"><Clipboard className="h-4 w-4" />{text.copy}</button>
            </div>
            <pre className="mt-2 max-h-52 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-xs text-[var(--text-primary)]">{analysis.parts.header.parseError ?? headerJson}</pre>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Payload</p>
              <button type="button" onClick={() => copyText(payloadJson)} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]"><Clipboard className="h-4 w-4" />{text.copy}</button>
            </div>
            <pre className="mt-2 max-h-52 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-xs text-[var(--text-primary)]">{analysis.parts.payload.parseError ?? payloadJson}</pre>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{text.claims}</p>
            <dl className="mt-2 grid grid-cols-2 gap-3 text-sm text-[var(--text-muted)]">
              <div><dt className="text-[var(--text-primary)]">alg</dt><dd className="break-all">{analysis.metadata.alg || text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">typ</dt><dd className="break-all">{analysis.metadata.typ || text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">kid</dt><dd className="break-all">{analysis.metadata.kid || text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">iss</dt><dd className="break-all">{analysis.metadata.iss || text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">sub</dt><dd className="break-all">{analysis.metadata.sub || text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">aud</dt><dd className="break-all">{analysis.metadata.aud || text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">exp</dt><dd className="break-all">{analysis.metadata.exp ? `${analysis.metadata.exp} (${formatNumericDate(analysis.metadata.exp)})` : text.unknown}</dd></div>
              <div><dt className="text-[var(--text-primary)]">nbf</dt><dd className="break-all">{analysis.metadata.nbf ? `${analysis.metadata.nbf} (${formatNumericDate(analysis.metadata.nbf)})` : text.unknown}</dd></div>
            </dl>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] p-3 text-xs">
            <p className="font-semibold text-[var(--text-primary)]">{text.signature}</p>
            <p className="mt-2 break-all text-[var(--text-muted)]">{analysis.parts.signature || text.unknown}</p>
          </div>
          <button type="button" onClick={() => copyText(`${analysis.parts.header.raw}.${analysis.parts.payload.raw}.${analysis.parts.signature}`)} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]"><Clipboard className="h-4 w-4" />{text.copy}</button>
          <button type="button" onClick={() => copyText(token)} className="mt-3 ml-2 inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]"><Clipboard className="h-4 w-4" />{text.copyToken}</button>
          <button type="button" onClick={() => copyText(claimsText)} className="mt-3 ml-2 inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]"><Clipboard className="h-4 w-4" />{text.copyAll}</button>

          <div className="mt-5 space-y-2 text-xs text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text-primary)]">{text.examples[0]}</p>
            <p>{text.examples[1]}</p>
          </div>
          <p role="status" className="mt-3 text-xs text-[var(--text-muted)]">{copyState === "copied" ? text.copied : copyState === "failed" ? text.copyFailed : ""}</p>
          {analysis.verification.state === "ok" ? <CheckCircle2 className="mt-3 h-4 w-4 text-[var(--accent-text)]" /> : analysis.verification.state === "mismatch" ? <XCircle className="mt-3 h-4 w-4 text-[var(--danger-text)]" /> : null}
          <p className="mt-2 text-xs">{analysis.verification.message}</p></>}
        </div>
      </section>
    </main>
  );
}
