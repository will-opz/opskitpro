import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "./admin-auth";

// Pages check independently: a shared layout may be reused on navigation.
export async function requireAdminIdentity() {
  const identity = await getAdminIdentity(await headers());
  if (!identity.authenticated) {
    const lang = (await cookies()).get("NEXT_LOCALE")?.value === "zh" ? "zh" : "en";
    redirect(`/${lang}/nav?admin=1`);
  }
  return identity;
}
