import "./globals.css";
import { NotFoundContent } from "@/components/NotFoundContent";
import { themeInitScript } from "@/lib/theme-init";

export const metadata = { title: "404 · OpsKitPro", robots: { index: false, follow: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript + `document.documentElement.lang = location.pathname.startsWith('/zh') ? 'zh' : 'en';` }} /></head>
      <body className="ui-shell"><NotFoundContent /></body>
    </html>
  );
}
