import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from "react";
import clsx from "clsx";

type ActionVariant = "primary" | "secondary" | "ghost";
type ActionSize = "default" | "small";

type ActionClassOptions = {
  className?: string;
  size?: ActionSize;
  variant?: ActionVariant;
};

function getActionClassName({
  className,
  size = "default",
  variant = "secondary",
}: ActionClassOptions) {
  return clsx(
    "button",
    variant === "primary" && "button--primary",
    variant === "ghost" && "button--ghost",
    size === "small" && "button--small",
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ActionClassOptions;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={getActionClassName({ className, size, variant })}
      type={type}
      {...props}
    />
  );
}

export type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & ActionClassOptions;

export function LinkButton({
  className,
  size,
  variant,
  ...props
}: LinkButtonProps) {
  return <a className={getActionClassName({ className, size, variant })} {...props} />;
}

export type ActionButtonProps = HTMLAttributes<HTMLSpanElement> & ActionClassOptions;

export function ActionButton({
  className,
  size,
  variant,
  ...props
}: ActionButtonProps) {
  return <span className={getActionClassName({ className, size, variant })} {...props} />;
}
