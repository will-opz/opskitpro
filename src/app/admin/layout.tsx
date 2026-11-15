import type { Viewport } from "next";
import { cookies } from "next/headers";
import "../globals.css";
import { AdminSessionProvider } from "@/components/AdminSessionProvider";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { themeInitScript } from "@/lib/theme-init";
import { requireAdminIdentity } from "@/lib/admin-page-auth";

export const viewport: Viewport = { colorScheme: "light dark" };

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminIdentity();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "en") as "zh" | "en";

  const dict = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head><body className="ui-shell"><AdminSessionProvider lang={lang}>
      <SiteHeader dict={dict} lang={lang} />
      {children}
      <SiteFooter dict={dict} lang={lang} />
    </AdminSessionProvider></body></html>
  );
}
