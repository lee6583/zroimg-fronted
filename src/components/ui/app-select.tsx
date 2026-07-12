"use client";

import clsx from "clsx";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./app-select.module.css";

export type AppSelectOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

type AppSelectProps<T extends string> = {
  value: T;
  options: Array<AppSelectOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

export function AppSelect<T extends string>(props: AppSelectProps<T>) {
  const value = props.value;
  const options = props.options;
  const onChange = props.onChange;
  const placeholder = props.placeholder ?? "请选择";
  const disabled = props.disabled ?? false;
  const className = props.className;
  const triggerClassName = props.triggerClassName;

  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const enabledOptions = options.filter((option) => !option.disabled);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  function selectValue(nextValue: T) {
    onChange(nextValue);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = enabledOptions.findIndex((option) => option.value === value);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
      const nextOption = enabledOptions[nextIndex];
      if (nextOption) selectValue(nextOption.value);
    }
  }

  return (
    <div ref={rootRef} className={clsx(styles.appSelect, className)}>
      <button
        type="button"
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className={clsx(
          styles.appSelect__trigger,
          isOpen && styles.appSelect__triggerOpen,
          triggerClassName,
        )}
      >
        <span className={styles.appSelect__label}>{selectedOption?.label ?? placeholder}</span>
        <span className={styles.appSelect__icon}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {isOpen ? (
        <div role="listbox" className={styles.appSelect__menu}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => selectValue(option.value)}
                className={clsx(
                  styles.appSelect__option,
                  selected && styles.appSelect__optionSelected,
                )}
              >
                <span className={styles.appSelect__optionLabel}>{option.label}</span>
                {selected ? (
                  <Check size={18} className={styles.appSelect__check} />
                ) : (
                  <span className={styles.appSelect__checkPlaceholder} />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
