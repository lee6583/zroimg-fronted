import { getCurrentUserProfile } from "@/server/auth";
import { getPublicAnnouncement } from "@/server/bff/account";
import { ProductTopNavClient } from "./product-top-nav-client";

const publicCenterLinks = [
  { label: "创作图片", href: "/generate" },
  { label: "视频生成", href: "/video" },
  { label: "作品画廊", href: "/gallery" },
  { label: "定价", href: "/pricing" },
  { label: "文档", href: "/docs" },
];

const appCenterLinks = publicCenterLinks;
const adminCenterLinks: typeof publicCenterLinks = [];

function avatarLabel(name?: string | null) {
  return (name || "Z").trim().slice(0, 1).toUpperCase();
}

export async function ProductTopNav() {
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
      avatarLabel={avatarLabel(current?.profile.username)}
      isLoggedIn={Boolean(current)}
      links={centerLinks}
    />
  );
}
