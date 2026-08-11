import { getCurrentUserProfile } from "@/server/auth";
import { getPublicAnnouncement } from "@/server/bff/account";
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
  const [current, announcement] = await Promise.all([
    getCurrentUserProfile(),
    getPublicAnnouncement(),
  ]);
  let centerLinks = publicCenterLinks;
  if (current) {
    centerLinks = appCenterLinks;
  }
  if (current?.profile.role === "admin") {
    centerLinks = adminCenterLinks;
  }

  return (
    <ProductTopNavClient
      announcement={announcement}
      avatarUrl={current?.profile.avatarUrl ?? null}
      username={current?.profile.username || "Z"}
      isLoggedIn={Boolean(current)}
      autoOpenAnnouncement={Boolean(props.autoOpenAnnouncement && current)}
      links={centerLinks}
    />
  );
}
