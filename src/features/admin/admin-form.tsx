"use client";

import clsx from "clsx";
import { Check, ChevronDown, MoreHorizontal } from "lucide-react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./admin-workspace.module.css";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  isFull?: boolean;
  isGroup?: boolean;
  className?: string;
  children: ReactNode;
};

type SwitchRowProps = {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

type ChipOption = {
  value: string;
  label: ReactNode;
};

type ChipGroupProps = {
  label: string;
  options: ChipOption[];
  selected: string[];
  isFull?: boolean;
  onToggle: (value: string) => void;
};

type AffixProps = {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
};

type AdvancedProps = {
  id: string;
  children: ReactNode;
};

type MenuItem = {
  label: string;
  icon?: ReactNode;
  isDanger?: boolean;
  onSelect: () => void;
};

type MoreMenuProps = {
  label: string;
  items: MenuItem[];
};

type FormCardProps = {
  title: string;
  actions?: ReactNode;
  message?: string;
  saveLabel: string;
  isSaving: boolean;
  canSave?: boolean;
  onSubmit: () => void;
  children: ReactNode;
};

type MenuPosition = {
  top: number;
  right: number;
};

export function Field(props: FieldProps) {
  const label = props.label;
  const hint = props.hint;
  const isFull = props.isFull ?? false;
  const isGroup = props.isGroup ?? false;
  const className = clsx(styles.fieldGroup, isFull && styles.fieldGroupFull, props.className);
  const labelId = useId();

  const hintNode = hint ? <span className={styles.fieldHint}>{hint}</span> : null;

  if (isGroup) {
    return (
      <div className={className} role="group" aria-labelledby={labelId}>
        <span id={labelId} className={styles.fieldLabel}>
          {label}
        </span>
        {props.children}
        {hintNode}
      </div>
    );
  }

  return (
    <label className={className}>
      <span className={styles.fieldLabel}>{label}</span>
      {props.children}
      {hintNode}
    </label>
  );
}

export function SwitchRow(props: SwitchRowProps) {
  const label = props.label;
  const hint = props.hint;
  const checked = props.checked;
  const disabled = props.disabled ?? false;
  const onChange = props.onChange;

  return (
    <label className={clsx(styles.switchRow, disabled && styles.switchRowDisabled)}>
      <span className={styles.switchCopy}>
        <span>{label}</span>
        {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
      </span>
      <input
        className={styles.switch}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function ChipGroup(props: ChipGroupProps) {
  const options = props.options;
  const selected = props.selected;
  const onToggle = props.onToggle;

  return (
    <Field label={props.label} isFull={props.isFull} isGroup>
      {options.length ? (
        <div className={styles.chipGroup}>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                className={clsx(styles.chip, isSelected && styles.chipActive)}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.value)}
              >
                {isSelected ? <Check size={13} aria-hidden="true" /> : null}
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <span className={styles.readonlyValue}>无可选项</span>
      )}
    </Field>
  );
}

export function Affix(props: AffixProps) {
  const prefix = props.prefix;
  const suffix = props.suffix;

  return (
    <span className={styles.affix}>
      {prefix ? <span className={styles.affixText}>{prefix}</span> : null}
      {props.children}
      {suffix ? <span className={styles.affixText}>{suffix}</span> : null}
    </span>
  );
}

export function Advanced(props: AdvancedProps) {
  const storageKey = `zroimg-admin-advanced:${props.id}`;
  const contentId = useId();
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const isStoredOpen = window.localStorage.getItem(storageKey) === "1";
    // localStorage 只能在挂载后读取，避免服务端与客户端首屏不一致。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(isStoredOpen);
  }, [storageKey]);

  function toggle() {
    const nextOpen = !isOpen;
    setOpen(nextOpen);
    window.localStorage.setItem(storageKey, nextOpen ? "1" : "0");
  }

  return (
    <section className={styles.advanced}>
      <button
        className={styles.advancedToggle}
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
      >
        <ChevronDown
          className={clsx(styles.advancedIcon, isOpen && styles.advancedIconOpen)}
          size={15}
          aria-hidden="true"
        />
        高级设置
      </button>
      <div id={contentId} className={styles.advancedBody} hidden={!isOpen}>
        {props.children}
      </div>
    </section>
  );
}

export function MoreMenu(props: MoreMenuProps) {
  const label = props.label;
  const items = props.items;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const isOpen = position !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    menuRef.current?.querySelector("button")?.focus();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const isInside =
        triggerRef.current?.contains(target) || menuRef.current?.contains(target) || false;
      if (!isInside) {
        setPosition(null);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setPosition(null);
        triggerRef.current?.focus();
      }
    }

    function close() {
      setPosition(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [isOpen]);

  function toggle() {
    if (isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }

  function select(item: MenuItem) {
    setPosition(null);
    item.onSelect();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const buttons = Array.from(menuRef.current?.querySelectorAll("button") ?? []);
    const index = buttons.findIndex((button) => button === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (index + step + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  }

  if (!items.length) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.iconAction}
        type="button"
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </button>
      {position ? (
        <div
          ref={menuRef}
          className={styles.menu}
          role="menu"
          style={{ top: position.top, right: position.right }}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item) => (
            <button
              key={item.label}
              className={clsx(styles.menuItem, item.isDanger && styles.menuItemDanger)}
              type="button"
              role="menuitem"
              onClick={() => select(item)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function FormCard(props: FormCardProps) {
  const title = props.title;
  const actions = props.actions;
  const message = props.message;
  const isSaving = props.isSaving;
  const canSave = props.canSave ?? true;
  const onSubmit = props.onSubmit;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className={styles.formCard} onSubmit={submit}>
      <header className={styles.formCardHeader}>
        <h2 className={styles.formCardTitle}>{title}</h2>
        {actions ? <div className={styles.headerActions}>{actions}</div> : null}
      </header>
      <div className={styles.formCardBody}>{props.children}</div>
      <footer className={styles.formCardFooter}>
        <button className={styles.primaryAction} type="submit" disabled={isSaving || !canSave}>
          {isSaving ? "保存中" : props.saveLabel}
        </button>
        {message ? <p className={styles.formMessage}>{message}</p> : null}
      </footer>
    </form>
  );
}
