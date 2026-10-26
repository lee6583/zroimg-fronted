import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ProductFrame } from "@/components/layout/product-frame";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { noindexRobots } from "@/lib/seo";
import { requireUser } from "@/server/auth";

// 登录后的应用页一律不收录；页面没有自己的标题时显示 metadata.app.title。
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.app");

  return {
    title: t("title"),
    description: t("description"),
    robots: noindexRobots,
  };
}

type ProductLayoutProps = {
  children: ReactNode;
};

export default async function ProductLayout(props: ProductLayoutProps) {
  const children = props.children;

  await requireUser();

  return <ProductFrame topNav={<ProductTopNav autoOpenAnnouncement />}>{children}</ProductFrame>;
}
