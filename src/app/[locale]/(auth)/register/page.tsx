import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/features/auth/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.register");

  return buildMetadata({
    locale,
    path: "/register",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="page-title">{t("title")}</h1>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted">
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
