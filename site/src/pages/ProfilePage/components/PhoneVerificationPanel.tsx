import type { ChangeEvent, FormEvent, KeyboardEvent, RefObject } from "react";
import clsx from "clsx";
import {
  formatRussianPhoneDigits,
  RUSSIAN_PHONE_DIGITS_LENGTH,
} from "../phoneFormat";
import styles from "../ProfilePage.module.scss";

type PhoneVerificationPanelProps = {
  phoneInputRef: RefObject<HTMLInputElement | null>;
  phoneDigits: string;
  phoneCode: string;
  phoneError: string;
  codeError: string;
  phoneErrorText: string;
  phoneMessage: string;
  phoneStatusLabel: string;
  phoneHelpText: string;
  isPhoneVerified: boolean;
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  cooldownSeconds: number;
  canSendCode: boolean;
  canVerifyCode: boolean;
  onSendCode: (event?: FormEvent) => void;
  onVerifyCode: (event: FormEvent) => void;
  onPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhoneKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onPhoneCodeChange: (value: string) => void;
};

export function PhoneVerificationPanel({
  phoneInputRef,
  phoneDigits,
  phoneCode,
  phoneError,
  codeError,
  phoneErrorText,
  phoneMessage,
  phoneStatusLabel,
  phoneHelpText,
  isPhoneVerified,
  isSendingCode,
  isVerifyingCode,
  cooldownSeconds,
  canSendCode,
  canVerifyCode,
  onSendCode,
  onVerifyCode,
  onPhoneChange,
  onPhoneKeyDown,
  onPhoneCodeChange,
}: PhoneVerificationPanelProps) {
  return (
    <section className={clsx(styles.card, styles.phoneCard)}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardTitle}>Телефон</h2>
          <span
            className={clsx(
              styles.phoneStatus,
              isPhoneVerified ? styles.phoneStatusVerified : styles.phoneStatusPending,
            )}
          >
            {phoneStatusLabel}
          </span>
        </div>
        <p className={styles.mutedText}>{phoneHelpText}</p>
      </div>

      <form className={clsx(styles.form, styles.phoneForm)} onSubmit={onSendCode} aria-busy={isSendingCode}>
        <div className={styles.phoneControls}>
          <label className={clsx(styles.field, styles.phoneField)}>
            <span className={styles.label}>Номер</span>
            <div
              className={clsx(styles.phoneInputGroup, phoneError && styles.phoneInputGroupInvalid)}
            >
              <span className={styles.phonePrefix}>+7</span>
              <input
                ref={phoneInputRef}
                className={styles.input}
                aria-invalid={Boolean(phoneError)}
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={18}
                type="tel"
                value={formatRussianPhoneDigits(phoneDigits)}
                onChange={onPhoneChange}
                onKeyDown={onPhoneKeyDown}
                placeholder="(999) 123-45-67"
                disabled={isSendingCode}
              />
              <span className={styles.phoneCounter}>
                {phoneDigits.length}/{RUSSIAN_PHONE_DIGITS_LENGTH}
              </span>
            </div>
            <span className={styles.fieldError} aria-live="polite">
              {phoneError || "\u00A0"}
            </span>
          </label>

          {!isPhoneVerified && (
            <button
              className={clsx(styles.secondaryButton, styles.phoneSendButton)}
              type="submit"
              disabled={!canSendCode}
            >
              {isSendingCode
                ? "Отправляем..."
                : cooldownSeconds > 0
                  ? `Повтор через ${cooldownSeconds} с`
                  : "Отправить SMS-код"}
            </button>
          )}
        </div>

        {(phoneErrorText || phoneMessage) && (
          <p
            className={clsx(
              styles.formMessage,
              phoneErrorText && styles.formError,
              phoneMessage && styles.formSuccess,
            )}
            aria-live="polite"
          >
            {phoneErrorText || phoneMessage}
          </p>
        )}
      </form>

      {!isPhoneVerified && (
        <form
          className={clsx(styles.form, styles.phoneCodeForm)}
          onSubmit={onVerifyCode}
          aria-busy={isVerifyingCode}
        >
          <label className={styles.field}>
            <span className={styles.label}>Код из SMS</span>
            <input
              className={styles.input}
              aria-invalid={Boolean(codeError)}
              inputMode="numeric"
              maxLength={6}
              value={phoneCode}
              onChange={(event) => onPhoneCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              disabled={isVerifyingCode}
            />
            <span className={styles.fieldError} aria-live="polite">
              {codeError || "\u00A0"}
            </span>
          </label>

          <div className={styles.actions}>
            <button
              className={clsx(styles.secondaryButton, styles.phoneVerifyButton)}
              type="submit"
              disabled={!canVerifyCode}
            >
              {isVerifyingCode ? "Проверяем..." : "Подтвердить"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
