import { getCurrentUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PublicAnnouncement } from "@/types/announcement";
import { ProductTopNavClient } from "./product-top-nav-client";

const publicCenterLinks = [
  { label: "首页", href: "/" },
  { label: "作品画廊", href: "/gallery" },
  { label: "定价", href: "/pricing" },
  { label: "文档", href: "/docs" },
];

const appCenterLinks = publicCenterLinks;
const adminCenterLinks: typeof publicCenterLinks = [];

export async function ProductTopNav(props: { autoOpenAnnouncement?: boolean } = {}) {
  const [user, announcement] = await Promise.all([
    getCurrentUser(),
    requestJava<PublicAnnouncement>("/content/public/announcement"),
  ]);
  let centerLinks = publicCenterLinks;
  if (user) {
    centerLinks = appCenterLinks;
  }
  if (user?.role === "admin") {
    centerLinks = adminCenterLinks;
  }

  return (
    <ProductTopNavClient
      announcement={announcement}
      avatarUrl={user?.avatarUrl ?? null}
      username={user?.username || "Z"}
      isLoggedIn={Boolean(user)}
      autoOpenAnnouncement={Boolean(props.autoOpenAnnouncement && user)}
      links={centerLinks}
    />
  );
}
