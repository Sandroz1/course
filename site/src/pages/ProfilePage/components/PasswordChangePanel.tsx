import type { FormEvent } from "react";
import clsx from "clsx";
import styles from "../ProfilePage.module.scss";

type PasswordChangePanelProps = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
  currentPasswordError: string;
  newPasswordError: string;
  newPassword2Error: string;
  passwordErrorText: string;
  passwordMessage: string;
  isChangingPassword: boolean;
  onChangePassword: (event: FormEvent) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onNewPassword2Change: (value: string) => void;
};

export function PasswordChangePanel({
  currentPassword,
  newPassword,
  newPassword2,
  currentPasswordError,
  newPasswordError,
  newPassword2Error,
  passwordErrorText,
  passwordMessage,
  isChangingPassword,
  onChangePassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onNewPassword2Change,
}: PasswordChangePanelProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Смена пароля</h2>
      </div>

      <form className={styles.form} onSubmit={onChangePassword} aria-busy={isChangingPassword}>
        <label className={styles.field}>
          <span className={styles.label}>Текущий пароль</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(currentPasswordError)}
            autoComplete="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
            required
            disabled={isChangingPassword}
          />
          <span className={styles.fieldError} aria-live="polite">
            {currentPasswordError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Новый пароль</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(newPasswordError)}
            autoComplete="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            required
            disabled={isChangingPassword}
          />
          <span className={styles.fieldError} aria-live="polite">
            {newPasswordError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Повтор нового пароля</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(newPassword2Error)}
            autoComplete="new-password"
            type="password"
            value={newPassword2}
            onChange={(event) => onNewPassword2Change(event.target.value)}
            required
            disabled={isChangingPassword}
          />
          <span className={styles.fieldError} aria-live="polite">
            {newPassword2Error || "\u00A0"}
          </span>
        </label>

        <p
          className={clsx(
            styles.formMessage,
            passwordErrorText && styles.formError,
            passwordMessage && styles.formSuccess,
            !passwordErrorText && !passwordMessage && styles.formMessageEmpty,
          )}
          aria-live="polite"
        >
          {passwordErrorText || passwordMessage || "\u00A0"}
        </p>

        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? "Меняем..." : "Сменить пароль"}
          </button>
        </div>
      </form>
    </section>
  );
}
