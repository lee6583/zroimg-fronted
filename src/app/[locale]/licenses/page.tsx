import clsx from "clsx";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import table from "@/components/ui/data-table.module.css";
import { buildMetadata } from "@/lib/seo";
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
  usage: string;
};

const items: LicenseItem[] = [
  {
    name: "xyflow (@xyflow/react)",
    url: "https://github.com/xyflow/xyflow",
    license: "MIT",
    copyright: "© 2019-2025 webkid GmbH",
    usage: "画布节点编辑",
  },
  {
    name: "Konva",
    url: "https://github.com/konvajs/konva",
    license: "MIT",
    copyright: "© 2011-2013 Eric Rowell，© 2014-present Anton Lavrenov",
    usage: "遮罩绘制",
  },
  {
    name: "react-konva",
    url: "https://github.com/konvajs/react-konva",
    license: "MIT",
    copyright: "© 2017 Anton Lavrenov",
    usage: "遮罩绘制",
  },
  {
    name: "Zustand",
    url: "https://github.com/pmndrs/zustand",
    license: "MIT",
    copyright: "© 2019 Paul Henschel",
    usage: "画布状态",
  },
  {
    name: "infinite-canvas",
    url: "https://github.com/basketikun/infinite-canvas",
    license: "MIT",
    copyright: "© 2026 basketikun",
    usage: "画布交互参考",
  },
  {
    name: "ANORA-Labs",
    url: "https://github.com/yapsgg/ANORA-Labs",
    license: "MIT",
    copyright: "© 2026 ANORA Labs",
    usage: "生成流程参考",
  },
  {
    name: "Loomic",
    url: "https://github.com/fancyboi999/Loomic",
    license: "MIT",
    copyright: "© 2026 Xinmin Zeng",
    usage: "架构参考",
  },
];

export default function LicensesPage() {
  return (
    <>
      <ProductTopNav />
      <main className={styles.licenses}>
        <div className={styles.licenses__inner}>
          <h1 className="page-title">开源许可</h1>

          <div className={table.dataTable__card}>
            <table className={clsx(table.dataTable, styles.licenses__table)}>
              <colgroup>
                <col className={styles.licenses__colName} />
                <col className={styles.licenses__colLicense} />
                <col />
                <col className={styles.licenses__colUsage} />
              </colgroup>
              <thead>
                <tr>
                  <th className={table.dataTable__start}>项目</th>
                  <th className={table.dataTable__start}>许可证</th>
                  <th className={table.dataTable__start}>版权</th>
                  <th className={table.dataTable__start}>用途</th>
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
                    <td className={table.dataTable__start}>{item.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
