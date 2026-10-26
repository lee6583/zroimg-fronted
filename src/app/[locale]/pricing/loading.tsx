import { getTranslations } from "next-intl/server";

export default async function PricingLoading() {
  const t = await getTranslations("common.status");

  return (
    <div className="grid min-h-80 place-items-center px-6 py-10 text-sm text-muted">
      {t("loading")}
    </div>
  );
}
