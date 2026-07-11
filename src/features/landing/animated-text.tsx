"use client";

import { useMemo } from "react";
import styles from "./animated-text.module.css";

export function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
}: {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}) {
  const words = text.split(" ");

  return (
    <span className={`inline-flex flex-wrap overflow-hidden ${className}`}>
      {words.map((word, index) => {
        const isLast = index === words.length - 1;
        return (
          <span
            key={`${word}-${index}`}
            className="relative inline-block overflow-visible pr-[0.08em]"
          >
            {word}
            {showAsterisk && isLast ? (
              <span className="absolute -right-[0.3em] top-[0.65em] text-[0.31em] leading-none">
                *
              </span>
            ) : null}
            {index < words.length - 1 ? "\u00a0" : null}
          </span>
        );
      })}
    </span>
  );
}

export function WordsPullUpMultiStyle({
  segments,
  className = "",
}: {
  segments: Array<{ text: string; className?: string }>;
  className?: string;
}) {
  const words = segments.flatMap((segment) =>
    segment.text.split(" ").map((word) => ({
      word,
      className: segment.className,
    })),
  );

  return (
    <div className={`inline-flex flex-wrap justify-center overflow-hidden ${className}`}>
      {words.map((item, index) => (
        <span
          key={`${item.word}-${index}`}
          className={`inline-block pr-[0.22em] ${item.className ?? ""}`}
        >
          {item.word}
        </span>
      ))}
    </div>
  );
}

export function ScrollRevealText({ text }: { text: string }) {
  const chars = useMemo(() => Array.from(text), [text]);

  return (
    <p className={styles.animatedText__scrollReveal}>
      {chars.map((char, index) => (
        <span key={`${char}-${index}`}>{char}</span>
      ))}
    </p>
  );
}
