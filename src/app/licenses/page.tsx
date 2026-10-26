import type { Metadata } from "next";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import styles from "./licenses.module.css";

export const metadata: Metadata = {
  title: "开源许可 | ZroImg",
  description: "ZroImg 使用和参考的开源项目及其许可证。",
};

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

          <div className={styles.licenses__tableWrap}>
            <table className={styles.licenses__table}>
              <thead>
                <tr>
                  <th>项目</th>
                  <th>许可证</th>
                  <th>版权</th>
                  <th>用途</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.url}>
                    <td>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.name}
                      </a>
                    </td>
                    <td>{item.license}</td>
                    <td>{item.copyright}</td>
                    <td>{item.usage}</td>
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
