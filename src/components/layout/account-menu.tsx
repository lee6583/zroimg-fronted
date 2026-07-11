"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { authApi } from "@/api/auth/email-auth";
import styles from "./product-top-nav.module.css";

export function AccountMenu({ label }: { label: string }) {
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
        className={styles.productTopNav__avatar}
        aria-label="打开账户菜单"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
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
            账户设置
          </Link>
          <button
            type="button"
            className={styles.productTopNav__accountItem}
            role="menuitem"
            disabled={isLoggingOut}
            onClick={logout}
          >
            <LogOut size={15} />
            退出登录
          </button>
        </div>
      ) : null}
    </div>
  );
}
