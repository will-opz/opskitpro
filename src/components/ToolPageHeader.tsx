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
    <header className="max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {title}
        </h1>
        <span className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${mode === "local" ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-700" : "border-sky-500/20 bg-sky-500/[0.06] text-sky-700"}`}>
          {processing}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)] sm:text-base">
        {description}
      </p>
    </header>
  );
}
