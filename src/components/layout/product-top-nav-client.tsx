"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { PublicAnnouncement } from "@/types/announcement";
import { AccountMenu } from "@/components/layout/account-menu";
import { AnnouncementCenter } from "@/components/layout/announcement-center";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeControls } from "@/components/layout/theme-controls";
import styles from "./product-top-nav.module.css";

type TopNavLink = {
  label: string;
  href: string;
};

type ProductTopNavClientProps = {
  announcement: PublicAnnouncement;
  avatarLabel: string;
  isLoggedIn: boolean;
  links: TopNavLink[];
};

type PendingLink = {
  href: string;
};

function getActiveHref(pathname: string, links: TopNavLink[]) {
  const activeLink = links.find((item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return activeLink?.href ?? "";
}

export function ProductTopNavClient(props: ProductTopNavClientProps) {
  const announcement = props.announcement;
  const avatarLabel = props.avatarLabel;
  const isLoggedIn = props.isLoggedIn;
  const links = props.links;
  const pathname = usePathname();
  const router = useRouter();
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);

  const activeHref = useMemo(() => {
    return getActiveHref(pathname, links);
  }, [links, pathname]);

  const isPendingCurrent =
    pendingLink !== null &&
    (pathname === pendingLink.href || pathname.startsWith(`${pendingLink.href}/`));
  const visibleHref = pendingLink && !isPendingCurrent ? pendingLink.href : activeHref;

  function prefetchPage(href: string) {
    router.prefetch(href);
  }

  function renderLink(item: TopNavLink, className: string, activeClassName: string) {
    const isActive = visibleHref === item.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        onClick={() => setPendingLink({ href: item.href })}
        onFocus={() => prefetchPage(item.href)}
        onMouseEnter={() => prefetchPage(item.href)}
        className={clsx(className, isActive && activeClassName)}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <header className={styles.productTopNav}>
      <div className={styles.productTopNav__inner}>
        <BrandLogo />

        <nav className={styles.productTopNav__center}>
          {links.map((item) => {
            return renderLink(
              item,
              styles.productTopNav__link,
              styles.productTopNav__linkActive,
            );
          })}
        </nav>

        <div className={styles.productTopNav__actions}>
          <AnnouncementCenter announcement={announcement} shouldAutoOpen={isLoggedIn} />
          <ThemeControls />
          {isLoggedIn ? (
            <AccountMenu label={avatarLabel} />
          ) : (
            <Link href="/login" className={styles.productTopNav__avatar} aria-label="登录">
              登录
            </Link>
          )}
        </div>
      </div>

      <nav className={styles.productTopNav__mobileNav}>
        {links.map((item) => {
          return renderLink(
            item,
            styles.productTopNav__mobileLink,
            styles.productTopNav__mobileLinkActive,
          );
        })}
      </nav>
    </header>
  );
}
