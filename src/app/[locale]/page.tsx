import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingPage } from "@/features/landing/landing-page";
import { buildMetadata } from "@/lib/seo";
import { organization, website } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.home");

  return buildMetadata({
    locale,
    path: "/",
    title: t("title"),
    description: t("description"),
    isAbsoluteTitle: true,
  });
}

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <>
      <JsonLd data={[organization(), website(locale)]} />
      <LandingPage />
    </>
  );
}
