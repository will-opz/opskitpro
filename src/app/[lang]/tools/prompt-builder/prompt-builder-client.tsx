"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  RefreshCw,
} from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";

type Lang = "zh" | "en";

type FormState = {
  goal: string;
  scope: string;
  constraints: string;
  avoid: string;
  verification: string;
  notes: boolean;
  publicBoundary: boolean;
};

const copy = {
  zh: {
    home: "首页",
    tools: "工具",
    badge: "AI 工程工作流",
    title: "提示词构建器",
    desc: "把任务目标、边界、验证方式整理成可直接交给 AI Coding Agent 的工程 prompt。所有内容只在本地生成。",
    goal: "任务目标",
    goalPlaceholder: "例如：优化 /tools 的 AI Engineering 区块，让入口更清晰。",
    scope: "目标页面 / 模块",
    scopePlaceholder:
      "例如：产品列表页面与搜索组件",
    constraints: "必须遵守的约束",
    constraintsPlaceholder:
      "例如：沿用现有组件，不增加依赖，支持手机与键盘操作。",
    avoid: "不要改什么",
    avoidPlaceholder: "例如：不要重构全站，不要改无关页面，不要提交草稿内容。",
    verification: "验证命令",
    verificationPlaceholder: "npm test\nnpx tsc --noEmit\nnpm run build",
    notes: "记录验证结果",
    publicBoundary: "严格检查公开 / 私有边界",
    output: "生成的 Prompt",
    copy: "复制",
    copied: "已复制",
    reset: "重置",
  },
  en: {
    home: "Home",
    tools: "Tools",
    badge: "AI Engineering Workflow",
    title: "Prompt Builder",
    desc: "Turn goals, scope, guardrails, and checks into a scoped prompt for AI coding agents. Everything runs locally.",
    goal: "Task goal",
    goalPlaceholder: "Example: polish the AI Engineering section on /tools.",
    scope: "Target page / module",
    scopePlaceholder:
      "Example: the product list page and search component",
    constraints: "Required constraints",
    constraintsPlaceholder:
      "Example: minimal changes, no new dependencies, support keyboard use, preserve public/private boundaries.",
    avoid: "Do not change",
    avoidPlaceholder:
      "Example: do not refactor the whole site, do not touch unrelated pages, do not publish draft content.",
    verification: "Verification commands",
    verificationPlaceholder: "npm test\nnpx tsc --noEmit\nnpm run build",
    notes: "Document verification results",
    publicBoundary: "Check public/private boundaries strictly",
    output: "Generated Prompt",
    copy: "Copy",
    copied: "Copied",
    reset: "Reset",
  },
} satisfies Record<Lang, Record<string, string>>;

const initialState: FormState = {
  goal: "Add search to an existing product list.",
  scope: "Target only the directly related page or component.",
  constraints:
    "Keep changes minimal. Do not add dependencies. Preserve existing design patterns. Run tests and build checks.",
  avoid:
    "Do not refactor unrelated pages. Do not publish private notes, drafts, credentials, or internal process details.",
  verification: "npm test\nnpx tsc --noEmit\nnpm run build",
  notes: false,
  publicBoundary: true,
};

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export default function PromptBuilderClient({
  lang,
}: {
  dict: any;
  lang: Lang;
}) {
  const t = copy[lang] || copy.zh;
  const defaults: FormState = lang === "zh" ? { ...initialState, goal: "为现有产品列表增加搜索。", scope: "产品列表及搜索组件。", constraints: "沿用现有设计与依赖，支持手机和键盘操作。", avoid: "保留现有数据与无关功能。" } : initialState;
  const [form, setForm] = useState<FormState>(defaults);
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => [
    lang === "zh" ? "请协助完成以下项目任务。" : "Help implement the following project task.",
    `${t.goal}:\n${form.goal.trim() || t.goalPlaceholder}`,
    `${t.scope}:\n${form.scope.trim() || t.scopePlaceholder}`,
    `${t.constraints}:\n${form.constraints.trim()}`,
    `${t.avoid}:\n${form.avoid.trim()}`,
    `${t.verification}:\n${form.verification.trim()}`,
    form.publicBoundary ? lang === "zh" ? "不要公开凭据、个人资料或未授权的私有内容。" : "Do not publish credentials, personal data or unauthorized private content." : "",
    form.notes ? lang === "zh" ? "记录修改、验证结果和剩余限制。" : "Document changes, verification results and remaining limitations." : "",
  ].filter(Boolean).join("\n\n"), [form, lang, t]);

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copyPrompt = async () => {
    await writeClipboard(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-0 bg-[var(--bg-primary)] px-4 pb-8 pt-6 text-[var(--text-secondary)] sm:px-6 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <ToolPageHeader
          title={t.title}
          description={t.desc}
          processing={lang === "zh" ? "本地处理 · 不上传" : "Local processing · Not uploaded"}
        />

        <section className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_0.95fr]">
          <div className="op-card-soft rounded-[2rem] p-5 sm:p-6">
            <div className="grid gap-4">
              <Field
                label={t.goal}
                value={form.goal}
                placeholder={t.goalPlaceholder}
                onChange={(value) => update("goal", value)}
              />
              <Field
                label={t.scope}
                value={form.scope}
                placeholder={t.scopePlaceholder}
                onChange={(value) => update("scope", value)}
              />
              <details className="rounded-xl border border-[var(--border-subtle)] p-3"><summary className="cursor-pointer text-sm font-semibold">{lang === "zh" ? "约束与验证" : "Constraints & verification"}</summary><div className="mt-3 grid gap-3">
              <Field
                label={t.constraints}
                value={form.constraints}
                placeholder={t.constraintsPlaceholder}
                rows={3}
                onChange={(value) => update("constraints", value)}
              />
              <Field
                label={t.avoid}
                value={form.avoid}
                placeholder={t.avoidPlaceholder}
                rows={2}
                onChange={(value) => update("avoid", value)}
              />
              <Field
                label={t.verification}
                value={form.verification}
                placeholder={t.verificationPlaceholder}
                rows={2}
                onChange={(value) => update("verification", value)}
              />

              </div></details>
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  checked={form.notes}
                  label={t.notes}
                  onChange={(value) => update("notes", value)}
                />
                <Toggle
                  checked={form.publicBoundary}
                  label={t.publicBoundary}
                  onChange={(value) => update("publicBoundary", value)}
                />
              </div>
            </div>
          </div>

          <div className="op-card rounded-[2rem] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="op-icon-box h-10 w-10 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  {t.output}
                </h2>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(defaults)}
                  className="op-action whitespace-nowrap px-3 py-2 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t.reset}
                </button>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="op-action whitespace-nowrap px-3 py-2 text-xs"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
            <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap rounded-2xl border border-[var(--border-subtle)] bg-zinc-950 p-5 text-xs leading-6 text-zinc-200 shadow-inner">
              {prompt}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-[var(--accent-text)] focus:ring-emerald-500"
      />
      <ClipboardCheck className="h-4 w-4 text-[var(--accent-text)]" />
      {label}
    </label>
  );
}
