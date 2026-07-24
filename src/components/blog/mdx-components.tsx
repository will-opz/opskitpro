import Link from "next/link";

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
};
