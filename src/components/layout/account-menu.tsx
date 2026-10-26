"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { authApi } from "@/api/auth/email-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "./product-top-nav.module.css";

type AccountMenuProps = {
  name: string;
  avatarUrl: string | null;
};

export function AccountMenu(props: AccountMenuProps) {
  const name = props.name;
  const avatarUrl = props.avatarUrl;

  const t = useTranslations("nav.account");
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [isLoggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  async function logout() {
    try {
      setLoggingOut(true);
      await authApi.logoutAccount();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div ref={rootRef} className={styles.productTopNav__account}>
      <button
        type="button"
        className={styles.productTopNav__avatarButton}
        aria-label={t("openMenu")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <UserAvatar name={name} src={avatarUrl} size={34} decorative />
      </button>

      {isOpen ? (
        <div className={styles.productTopNav__accountMenu} role="menu">
          <Link
            href="/settings"
            className={styles.productTopNav__accountItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Settings size={15} />
            {t("settings")}
          </Link>
          <button
            type="button"
            className={styles.productTopNav__accountItem}
            role="menuitem"
            disabled={isLoggingOut}
            onClick={logout}
          >
            <LogOut size={15} />
            {t("logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
