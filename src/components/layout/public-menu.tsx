"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, BookOpen, House, Images, Menu, Tag, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import {
  MenuLink,
  MenuLocaleRow,
  MenuSection,
  MenuThemeRow,
  mobileMenuStyles,
} from "./mobile-menu";

type PublicMenuProps = {
  isLoggedIn: boolean;
  className?: string;
};

type PublicLinkKey = "home" | "gallery" | "pricing" | "docs";

type PublicLinkDef = {
  key: PublicLinkKey;
  href: string;
  icon: LucideIcon;
};

const publicLinks: PublicLinkDef[] = [
  { key: "home", href: "/", icon: House },
  { key: "gallery", href: "/gallery", icon: Images },
  { key: "pricing", href: "/pricing", icon: Tag },
  { key: "docs", href: "/docs", icon: BookOpen },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 公开页（首页、画廊、定价、文档、认证页）在手机端的菜单按钮和菜单面板；桌面端由调用方用 CSS 隐藏。 */
export function PublicMenu(props: PublicMenuProps) {
  const isLoggedIn = props.isLoggedIn;
  const t = useTranslations("nav.top");
  const tActions = useTranslations("common.actions");
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={clsx("nav-icon-button", props.className)}
        aria-label={t("menu")}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      <Sheet open={isOpen} onClose={close} title={t("menuTitle")}>
        <MenuSection>
          {publicLinks.map((item) => (
            <MenuLink
              key={item.key}
              href={item.href}
              label={t(item.key)}
              icon={item.icon}
              isActive={isCurrent(pathname, item.href)}
              onNavigate={close}
            />
          ))}
        </MenuSection>

        <MenuSection>
          <MenuLocaleRow onSwitch={close} />
          <MenuThemeRow />
        </MenuSection>

        <div className={mobileMenuStyles.mobileMenu__actions}>
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn-primary" onClick={close}>
              {tActions("enterWorkspace")}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/generate" className="btn-primary" onClick={close}>
                {tActions("startCreating")}
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn-secondary" onClick={close}>
                {tActions("login")}
              </Link>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
