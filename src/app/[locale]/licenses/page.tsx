import clsx from "clsx";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import table from "@/components/ui/data-table.module.css";
import { buildMetadata } from "@/lib/seo";
import type { Messages } from "next-intl";
import styles from "./licenses.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.licenses");

  return buildMetadata({
    locale,
    path: "/licenses",
    title: t("title"),
    description: t("description"),
  });
}

type LicenseItem = {
  name: string;
  url: string;
  license: string;
  copyright: string;
  usage: keyof Messages["licenses"]["usage"];
};

const items: LicenseItem[] = [
  {
    name: "xyflow (@xyflow/react)",
    url: "https://github.com/xyflow/xyflow",
    license: "MIT",
    copyright: "© 2019-2025 webkid GmbH",
    usage: "canvasEditor",
  },
  {
    name: "Konva",
    url: "https://github.com/konvajs/konva",
    license: "MIT",
    copyright: "© 2011-2013 Eric Rowell, © 2014-present Anton Lavrenov",
    usage: "maskDrawing",
  },
  {
    name: "react-konva",
    url: "https://github.com/konvajs/react-konva",
    license: "MIT",
    copyright: "© 2017 Anton Lavrenov",
    usage: "maskDrawing",
  },
  {
    name: "Zustand",
    url: "https://github.com/pmndrs/zustand",
    license: "MIT",
    copyright: "© 2019 Paul Henschel",
    usage: "canvasState",
  },
  {
    name: "infinite-canvas",
    url: "https://github.com/basketikun/infinite-canvas",
    license: "MIT",
    copyright: "© 2026 basketikun",
    usage: "canvasReference",
  },
  {
    name: "ANORA-Labs",
    url: "https://github.com/yapsgg/ANORA-Labs",
    license: "MIT",
    copyright: "© 2026 ANORA Labs",
    usage: "generationReference",
  },
  {
    name: "Loomic",
    url: "https://github.com/fancyboi999/Loomic",
    license: "MIT",
    copyright: "© 2026 Xinmin Zeng",
    usage: "architectureReference",
  },
];

export default async function LicensesPage() {
  const t = await getTranslations("licenses");

  return (
    <>
      <ProductTopNav />
      <main className={styles.licenses}>
        <div className={styles.licenses__inner}>
          <h1 className="page-title">{t("title")}</h1>

          <div className={clsx(table.dataTable__card, styles.licenses__tableCard)}>
            <table className={clsx(table.dataTable, styles.licenses__table)}>
              <colgroup>
                <col className={styles.licenses__colName} />
                <col className={styles.licenses__colLicense} />
                <col />
                <col className={styles.licenses__colUsage} />
              </colgroup>
              <thead>
                <tr>
                  <th className={table.dataTable__start}>{t("columns.project")}</th>
                  <th className={table.dataTable__start}>{t("columns.license")}</th>
                  <th className={table.dataTable__start}>{t("columns.copyright")}</th>
                  <th className={table.dataTable__start}>{t("columns.usage")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.url}>
                    <td className={table.dataTable__start}>
                      <a
                        className={table.dataTable__ellipsis}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        title={item.name}
                      >
                        {item.name}
                      </a>
                    </td>
                    <td className={table.dataTable__start}>{item.license}</td>
                    <td className={table.dataTable__start}>
                      <span className={table.dataTable__ellipsis} title={item.copyright}>
                        {item.copyright}
                      </span>
                    </td>
                    <td className={table.dataTable__start}>{t(`usage.${item.usage}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.licenses__cards}>
            {items.map((item) => (
              <li key={item.url} className={styles.licenses__card}>
                <div className={styles.licenses__cardHead}>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.name}
                  </a>
                  <span className={styles.licenses__badge}>{item.license}</span>
                </div>
                <dl className={styles.licenses__cardBody}>
                  <div>
                    <dt>{t("columns.copyright")}</dt>
                    <dd>{item.copyright}</dd>
                  </div>
                  <div>
                    <dt>{t("columns.usage")}</dt>
                    <dd>{t(`usage.${item.usage}`)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
