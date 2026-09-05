type ToolPageHeaderProps = {
  title: string;
  description: string;
  processing: string;
  mode?: "local" | "network";
};

export function ToolPageHeader({
  title,
  description,
  processing,
  mode = "local",
}: ToolPageHeaderProps) {
  return (
    <header className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h1>
        <span className={`max-w-full rounded-full border px-3 py-1 text-xs leading-5 font-semibold ${mode === "local" ? "border-emerald-500/20 bg-emerald-500/[0.06] text-[var(--accent-text)]" : "border-sky-500/20 bg-sky-500/[0.06] text-[var(--info-text)]"}`}>
          {processing}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)] sm:text-base">
        {description}
      </p>
    </header>
  );
}
