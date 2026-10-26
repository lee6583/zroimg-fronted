import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type NotFoundViewProps = {
  locale: AppLocale;
};

export async function NotFoundView(props: NotFoundViewProps) {
  const locale = props.locale;
  const t = await getTranslations({ locale, namespace: "errors.notFound" });

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="surface w-full max-w-md rounded-md p-6 text-center">
        <p className="text-sm font-semibold text-muted">{t("code")}</p>
        <h1 className="mt-2 text-xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("description")}</p>
        <Link href="/" className="btn-primary mx-auto mt-5">
          {t("backHome")}
        </Link>
      </section>
    </main>
  );
}
