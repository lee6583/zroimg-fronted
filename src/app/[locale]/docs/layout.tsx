import { getLocale } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { getDocsNavigation } from "@/content/docs";
import { DocsSidebar } from "@/features/docs/docs-sidebar";
import styles from "@/features/docs/docs.module.css";

export default async function DocsLayout(props: LayoutProps<"/[locale]/docs">) {
  const locale = await getLocale();
  const sections = getDocsNavigation(locale);

  return (
    <div className={styles.docs__root}>
      <div className={styles.docs__topNav}>
        <ProductTopNav />
      </div>
      <div className={styles.docs}>
        <DocsSidebar sections={sections} />
        <main className={styles.docs__main}>{props.children}</main>
      </div>
    </div>
  );
}
