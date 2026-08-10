import type { ReactNode } from "react";
import { AdminNav } from "@/components/layout/admin-nav";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import styles from "./shell.module.css";

type AdminShellProps = {
  children: ReactNode;
};

export async function AdminShell(props: AdminShellProps) {
  const children = props.children;

  return (
    <>
      <ProductTopNav />
      <div className={styles.shell}>
        <div className={styles.shell__grid}>
          <aside className={styles.shell__sidebar}>
            <div className={styles.shell__sidebarInner}>
              <AdminNav />
            </div>
          </aside>
          <main className={styles.shell__main}>{children}</main>
        </div>
      </div>
    </>
  );
}
