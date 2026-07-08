import Link from "next/link";
import Image from "next/image";

export const mdxComponents = {
  a: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href?.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={href || "#"}
          className="font-semibold text-emerald-600 hover:text-emerald-500"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-emerald-600 hover:text-emerald-500 underline decoration-emerald-500/30 underline-offset-4"
        {...props}
      >
        {children}
      </a>
    );
  },
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-[15px] leading-8 text-zinc-700 mt-5" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-2xl font-black tracking-tight text-zinc-900 mt-10 mb-5"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-xl font-bold tracking-tight text-zinc-900 mt-8 mb-4"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="mt-6 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 text-[15px] leading-7 text-zinc-700"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="flex gap-3 before:content-[''] before:mt-2 before:h-2 before:w-2 before:shrink-0 before:rounded-full before:bg-emerald-500"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-sm font-medium text-zinc-900"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-800"
      {...props}
    />
  ),
};
