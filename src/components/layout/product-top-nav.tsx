import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PublicAnnouncement } from "@/types/announcement";
import { ProductTopNavClient } from "./product-top-nav-client";

type ProductTopNavProps = {
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
      autoOpenAnnouncement={Boolean(props.autoOpenAnnouncement && user)}
      canSwitchLocale={!props.isAdminConsole}
      links={centerLinks}
    />
  );
}
