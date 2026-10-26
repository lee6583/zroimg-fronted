"use client";

import { ConfigProvider, message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useTranslations } from "next-intl";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";

type HistoryTableContextValue = {
  notice: MessageInstance;
  removedTaskNos: string[];
  remove: (taskNo: string) => void;
};

type HistoryTableProps = {
  children: ReactNode;
};

type HistoryRowProps = {
  taskNo: string;
  className?: string;
  children: ReactNode;
};

const HistoryTableContext = createContext<HistoryTableContextValue | null>(null);

export function useHistoryTable() {
  const value = useContext(HistoryTableContext);
  if (!value) {
    throw new Error("useHistoryTable must be used inside HistoryTable");
  }

  return value;
}

export function HistoryTable(props: HistoryTableProps) {
  const children = props.children;

  const t = useTranslations("history");
  const router = useRouter();
  const [notice, contextHolder] = message.useMessage();
  const [removedTaskNos, setRemovedTaskNos] = useState<string[]>([]);

  // 删除成功后先隐藏同一任务的所有行，再刷新服务端分页和总数
  function remove(taskNo: string) {
    setRemovedTaskNos((current) => [...current, taskNo]);
    notice.success(t("delete.done"));
    router.refresh();
  }

  return (
    <ConfigProvider
      button={{ autoInsertSpace: false }}
      theme={{
        token: {
          colorPrimary: "var(--foreground)",
          colorPrimaryActive: "var(--foreground)",
          colorPrimaryHover: "var(--foreground)",
          colorText: "var(--foreground)",
          colorTextHeading: "var(--foreground)",
          colorBgContainer: "var(--panel)",
          colorBgElevated: "var(--panel)",
          colorBorder: "var(--line)",
          colorError: "#dc2626",
        },
      }}
    >
      <HistoryTableContext value={{ notice, removedTaskNos, remove }}>
        {children}
      </HistoryTableContext>
      {contextHolder}
    </ConfigProvider>
  );
}

export function HistoryRow(props: HistoryRowProps) {
  const taskNo = props.taskNo;
  const children = props.children;

  const table = useHistoryTable();
  if (table.removedTaskNos.includes(taskNo)) {
    return null;
  }

  return <tr className={props.className}>{children}</tr>;
}
