import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

  const user = await requireUser();
  // 管理员账号只使用后台，不进入创作端（Java 同样拒绝管理员调用用户端创作接口）。
  if (user.role === "admin") {
    redirect("/admin");
  }

  const account = {
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    totalPoints: user.totalPoints,
  };

  return (
    <ProductFrame topNav={<ProductTopNav variant="app" autoOpenAnnouncement />} account={account}>
      {children}
    </ProductFrame>
  );
}
