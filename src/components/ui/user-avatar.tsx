"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import styles from "./user-avatar.module.css";

type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  decorative?: boolean;
};

export function UserAvatar({
  name,
  src,
  size = 36,
  className,
  decorative = false,
}: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const label = (name || "Z").trim().slice(0, 1).toUpperCase();

  return (
    <span
      className={clsx(styles.userAvatar, className)}
      style={{ width: size, height: size }}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${name} 的头像`}
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
