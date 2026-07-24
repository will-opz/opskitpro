import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ADMIN_COOKIE_NAME,
  getCloudflareAccessEmail,
  isAdminIdentity,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "en") as "zh" | "en";
  const authenticated = await isAdminIdentity(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    getCloudflareAccessEmail(headerStore),
  );

  if (!authenticated) redirect("/tools?admin=1");

  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      {children}
      <SiteFooter dict={dict} />
    </>
  );
}
