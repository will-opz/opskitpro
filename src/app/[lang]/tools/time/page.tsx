import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import TimeClient from "./time-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return {
    title: `${dict.tools.time_title} - OpsKitPro`,
    description: dict.tools.time_desc,
    openGraph: {
      title: `${dict.tools.time_title} - OpsKitPro`,
      description: dict.tools.time_desc,
    },
  };
}

export default async function TimePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <TimeClient dict={dict} lang={lang} />
      <SiteFooter dict={dict} />
    </>
  );
}
