import clsx from "clsx";
import type { MouseEventHandler } from "react";

import styles from "./BrandLogo.module.scss";

type BrandLogoProps = {
  ariaHidden?: boolean;
  ariaLabel?: string;
  className?: string;
  href?: string;
  markClassName?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  showText?: boolean;
  textClassName?: string;
  title?: string;
};

export function BrandLogo({
  ariaHidden,
  ariaLabel,
  className,
  href,
  markClassName,
  onClick,
  showText = true,
  textClassName,
  title,
}: BrandLogoProps) {
  const content = (
    <>
      <img
        className={clsx(styles.mark, markClassName)}
        src="/brand/uchicode-icon.png"
        alt=""
        aria-hidden="true"
      />
      {showText && (
        <span className={clsx(styles.text, textClassName)} aria-hidden={Boolean(ariaLabel)}>
          <span className={styles.textLead}>uchi</span>
          <span className={styles.textAccent}>code</span>
          <span className={styles.textDomain}>.ru</span>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        className={clsx(styles.root, className)}
        href={href}
        aria-label={ariaLabel}
        title={title}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className={clsx(styles.root, className)}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      title={title}
    >
      {content}
    </span>
  );
}
