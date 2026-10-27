import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PublicAnnouncement } from "@/types/announcement";
import { ProductTopNavClient } from "./product-top-nav-client";

type ProductTopNavProps = {
  // public：公开页，手机端只显示 Logo 和菜单按钮；app：应用壳内，手机端语言/主题收进底部「我的」。
  variant?: "public" | "app";
  autoOpenAnnouncement?: boolean;
  // 后台只有中文，不显示语言切换器。
  isAdminConsole?: boolean;
};

export async function ProductTopNav(props: ProductTopNavProps = {}) {
  const [user, announcement, t] = await Promise.all([
    getCurrentUser(),
    requestJava<PublicAnnouncement>("/content/public/announcement"),
    getTranslations("nav.top"),
  ]);

  const publicCenterLinks = [
    { label: t("home"), href: "/" },
    { label: t("gallery"), href: "/gallery" },
    { label: t("pricing"), href: "/pricing" },
    { label: t("docs"), href: "/docs" },
  ];

  let centerLinks = publicCenterLinks;
  if (user?.role === "admin") {
    centerLinks = [];
  }

  return (
    <ProductTopNavClient
      announcement={announcement}
      avatarUrl={user?.avatarUrl ?? null}
      username={user?.username || "Z"}
      isLoggedIn={Boolean(user)}
      isAdmin={user?.role === "admin"}
      autoOpenAnnouncement={Boolean(props.autoOpenAnnouncement && user)}
      canSwitchLocale={!props.isAdminConsole}
      variant={props.isAdminConsole ? "admin" : (props.variant ?? "public")}
      links={centerLinks}
    />
  );
}
