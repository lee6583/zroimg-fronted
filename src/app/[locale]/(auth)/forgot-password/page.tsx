import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.forgotPassword");

  return buildMetadata({
    locale,
    path: "/forgot-password",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="page-title">重置密码</h1>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
