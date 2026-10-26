"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./user-avatar.module.css";

type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  decorative?: boolean;
};

export function UserAvatar(props: UserAvatarProps) {
  const name = props.name;
  const src = props.src;
  const size = props.size ?? 36;
  const className = props.className;
  const decorative = props.decorative ?? false;
  const t = useTranslations("ui.avatar");
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const label = (name || "Z").trim().slice(0, 1).toUpperCase();

  return (
    <span
      className={clsx(styles.userAvatar, className)}
      style={{ width: size, height: size }}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : t("label", { name })}
      role={decorative ? undefined : "img"}
    >
      {src && failedSrc !== src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span aria-hidden="true">{label}</span>
      )}
    </span>
  );
}
