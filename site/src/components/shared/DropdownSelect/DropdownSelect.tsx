import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./DropdownSelect.module.scss";

export type DropdownOption<Value extends string> = {
  value: Value;
  label: string;
};

export function DropdownSelect<Value extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: Value;
  options: Array<DropdownOption<Value>>;
  onChange: (value: Value) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectOption(nextValue: Value) {
    onChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      className={clsx(styles.root, className)}
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={`${label}: ${selectedOption?.label ?? ""}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className={styles.triggerText}>{selectedOption?.label}</span>
        <span className={clsx(styles.chevron, isOpen && styles.chevronOpen)} aria-hidden="true" />
      </button>

      {isOpen && (
        <div id={listboxId} className={styles.menu} role="listbox" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                className={clsx(styles.option, isSelected && styles.optionSelected)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.value)}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
