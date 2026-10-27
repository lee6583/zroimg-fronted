import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/login-form";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { getRegisterConfig } from "@/server/register-config";

// 注册入口随后台「开放注册」开关显示/隐藏
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.login");

  return buildMetadata({
    locale,
    path: "/login",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function LoginPage() {
  const [t, config] = await Promise.all([getTranslations("auth.login"), getRegisterConfig()]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="page-title">{t("title")}</h1>
        </div>
        <LoginForm />
        {config.registrationEnabled ? (
          <p className="mt-5 text-center text-sm text-muted">
            {t("noAccount")}{" "}
            <Link href="/register" className="font-medium text-foreground hover:underline">
              {t("registerLink")}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
