"use client";

import { ConfigProvider, Pagination } from "antd";
import type { PaginationProps } from "antd";
import zhCN from "antd/locale/zh_CN";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./app-pagination.module.css";

type AppPaginationProps = {
  current: number;
  pageSize: number;
  total: number;
};

const defaultPageSize = 10;
const pageSizeOptions = [10, 20, 50];

export function AppPagination(props: AppPaginationProps) {
  const current = props.current;
  const pageSize = props.pageSize;
  const total = props.total;

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updatePage(nextPage: number, nextPageSize: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    if (nextPageSize !== defaultPageSize) {
      params.set("pageSize", String(nextPageSize));
    } else {
      params.delete("pageSize");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const changePage: PaginationProps["onChange"] = (nextPage, nextPageSize) => {
    updatePage(nextPage, nextPageSize);
  };

  const changePageSize: PaginationProps["onShowSizeChange"] = (_currentPage, nextPageSize) => {
    updatePage(1, nextPageSize);
  };

  return (
    <div className={styles.appPagination}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: "var(--foreground)",
            colorPrimaryActive: "var(--foreground)",
            colorPrimaryHover: "var(--foreground)",
            controlItemBgActive: "var(--foreground)",
            controlItemBgHover: "var(--soft)",
          },
          components: {
            Select: {
              optionActiveBg: "var(--soft)",
              optionSelectedBg: "var(--foreground)",
              optionSelectedColor: "var(--background)",
            },
          },
        }}
      >
        <Pagination
          current={current}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={pageSizeOptions}
          showTotal={(count) => `共 ${count} 条`}
          onChange={changePage}
          onShowSizeChange={changePageSize}
        />
      </ConfigProvider>
    </div>
  );
}
