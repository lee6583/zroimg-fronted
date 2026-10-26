"use client";

import { ConfigProvider, Pagination } from "antd";
import type { PaginationProps } from "antd";
import type { Locale as AntdLocale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import ruRU from "antd/locale/ru_RU";
import zhCN from "antd/locale/zh_CN";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useIsMobile } from "./sheet";
import styles from "./app-pagination.module.css";

type AppPaginationProps = {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (page: number, pageSize: number) => void;
};

const defaultPageSize = 10;
const pageSizeOptions = [10, 20, 50];

// antd 自带文案（上一页、条/页、跳至）跟随当前 next-intl 语言。
const antdLocales: Record<AppLocale, AntdLocale> = {
  "zh-CN": zhCN,
  en: enUS,
  ru: ruRU,
};

export function AppPagination(props: AppPaginationProps) {
  const current = props.current;
  const pageSize = props.pageSize;
  const total = props.total;
  const onChange = props.onChange;

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("ui.pagination");
  // 手机端用简洁模式：上一页 / 当前页 / 总页数 / 下一页，不显示每页条数和总数。
  const isMobile = useIsMobile();

  function updatePage(nextPage: number, nextPageSize: number) {
    if (onChange) {
      onChange(nextPage, nextPageSize);
      return;
    }

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
        locale={antdLocales[locale]}
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
          simple={isMobile ? { readOnly: true } : false}
          showSizeChanger={!isMobile}
          pageSizeOptions={pageSizeOptions}
          showTotal={isMobile ? undefined : (count) => t("total", { count })}
          onChange={changePage}
          onShowSizeChange={changePageSize}
        />
      </ConfigProvider>
    </div>
  );
}
