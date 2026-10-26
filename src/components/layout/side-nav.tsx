"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, type LucideIcon } from "lucide-react";
import styles from "./shell.module.css";

type NavItem<K extends string = string> = {
  key: K;
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup<K extends string = string> = {
  key: string;
  label: string;
  icon: LucideIcon;
  items: Array<NavItem<K>>;
};

type SideNavProps<K extends string> = {
  storageKey: string;
  items?: Array<NavItem<K>>;
  groups: Array<NavGroup<K>>;
  activeKey: K | null;
  prefetch?: boolean;
  onNavigate?: (item: NavItem<K>) => void;
};

type NavLinkProps<K extends string> = {
  item: NavItem<K>;
  isActive: boolean;
  isNested?: boolean;
  prefetch?: boolean;
  onNavigate?: (item: NavItem<K>) => void;
};

const navEvent = "zroimg-nav-change";
const wideQuery = "(min-width: 768px)";

function subscribeStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(navEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(navEvent, callback);
  };
}

function subscribeWide(callback: () => void) {
  const query = window.matchMedia(wideQuery);
  query.addEventListener("change", callback);

  return () => query.removeEventListener("change", callback);
}

function getWide() {
  return window.matchMedia(wideQuery).matches;
}

function getServerValue() {
  return null;
}

function getServerWide() {
  return false;
}

function parseCollapsed(raw: string | null) {
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((key): key is string => typeof key === "string");
  } catch {
    return [];
  }
}

function writeCollapsed(storageKey: string, keys: string[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(keys));
  window.dispatchEvent(new Event(navEvent));
}

function NavLink<K extends string>(props: NavLinkProps<K>) {
  const item = props.item;
  const isActive = props.isActive;
  const isNested = props.isNested;
  const prefetch = props.prefetch;
  const onNavigate = props.onNavigate;
  const router = useRouter();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={prefetch}
      aria-current={isActive ? "page" : undefined}
      onFocus={() => router.prefetch(item.href)}
      onPointerEnter={() => router.prefetch(item.href)}
      onClick={() => onNavigate?.(item)}
      className={clsx(
        styles.shell__navLink,
        isNested && styles.shell__navLinkNested,
        isActive && styles.shell__navLinkActive,
      )}
    >
      <span className={clsx(styles.shell__navIcon, isActive && styles.shell__navIconActive)}>
        <Icon size={isNested ? 15 : 16} />
      </span>
      <span className={styles.shell__navText}>
        <span>{item.label}</span>
      </span>
    </Link>
  );
}

export function SideNav<K extends string>(props: SideNavProps<K>) {
  const storageKey = props.storageKey;
  const items = props.items ?? [];
  const groups = props.groups;
  const activeKey = props.activeKey;
  const prefetch = props.prefetch;
  const onNavigate = props.onNavigate;
  const baseId = useId();
  const [isAnimated, setAnimated] = useState(false);

  // Server and hydration render use the fallback snapshots, so every group starts expanded.
  const raw = useSyncExternalStore(
    subscribeStore,
    () => window.localStorage.getItem(storageKey),
    getServerValue,
  );
  const isWide = useSyncExternalStore(subscribeWide, getWide, getServerWide);
  const collapsed = parseCollapsed(raw);

  const activeGroup = groups.find((group) => {
    return group.items.some((item) => item.key === activeKey);
  });
  const activeGroupKey = activeGroup?.key ?? null;

  // Navigating into a collapsed group reopens it.
  useEffect(() => {
    if (!activeGroupKey) return;

    const stored = parseCollapsed(window.localStorage.getItem(storageKey));
    if (!stored.includes(activeGroupKey)) return;

    const next = stored.filter((key) => key !== activeGroupKey);
    writeCollapsed(storageKey, next);
  }, [activeGroupKey, storageKey]);

  function toggle(groupKey: string) {
    const isCollapsed = collapsed.includes(groupKey);
    let next = [...collapsed, groupKey];
    if (isCollapsed) {
      next = collapsed.filter((key) => key !== groupKey);
    }

    setAnimated(true);
    writeCollapsed(storageKey, next);
  }

  return (
    <nav className={clsx(styles.shell__nav, isAnimated && styles.shell__navAnimated)}>
      {items.length > 0 && (
        <div className={styles.shell__navList}>
          {items.map((item) => (
            <NavLink
              key={item.key}
              item={item}
              isActive={item.key === activeKey}
              prefetch={prefetch}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {groups.map((group) => {
        const listId = `${baseId}-${group.key}`;
        const isOpen = !isWide || !collapsed.includes(group.key);
        const isCurrent = group.key === activeGroupKey;
        const GroupIcon = group.icon;

        return (
          <div key={group.key} className={styles.shell__navGroup}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={listId}
              onClick={() => toggle(group.key)}
              className={clsx(
                styles.shell__navGroupHead,
                isCurrent && styles.shell__navGroupHeadCurrent,
              )}
            >
              <span className={styles.shell__navIcon}>
                <GroupIcon size={16} />
              </span>
              <span className={styles.shell__navGroupLabel}>{group.label}</span>
              <ChevronDown
                size={16}
                aria-hidden
                className={clsx(
                  styles.shell__navChevron,
                  !isOpen && styles.shell__navChevronClosed,
                )}
              />
            </button>
            <div
              className={clsx(
                styles.shell__navCollapse,
                !isOpen && styles.shell__navCollapseClosed,
              )}
              inert={!isOpen}
            >
              <div id={listId} className={styles.shell__navList}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.key}
                    item={item}
                    isActive={item.key === activeKey}
                    isNested
                    prefetch={prefetch}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export type { NavGroup, NavItem };
