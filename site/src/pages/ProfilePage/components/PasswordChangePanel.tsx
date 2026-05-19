import { type FormEvent, useId } from "react";
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
  const currentPasswordErrorId = useId();
  const newPasswordErrorId = useId();
  const newPassword2ErrorId = useId();
  const formMessageId = useId();

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Смена пароля</h2>
        <p className={styles.mutedText}>Укажите текущий пароль и новый пароль.</p>
      </div>

      <form
        className={styles.form}
        onSubmit={onChangePassword}
        aria-busy={isChangingPassword}
        aria-describedby={formMessageId}
      >
        <label className={styles.field}>
          <span className={styles.label}>Текущий пароль</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(currentPasswordError)}
            aria-describedby={currentPasswordErrorId}
            autoComplete="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
            required
            disabled={isChangingPassword}
          />
          <span id={currentPasswordErrorId} className={styles.fieldError} aria-live="polite">
            {currentPasswordError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Новый пароль</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(newPasswordError)}
            aria-describedby={newPasswordErrorId}
            autoComplete="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            required
            disabled={isChangingPassword}
          />
          <span id={newPasswordErrorId} className={styles.fieldError} aria-live="polite">
            {newPasswordError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Повтор нового пароля</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(newPassword2Error)}
            aria-describedby={newPassword2ErrorId}
            autoComplete="new-password"
            type="password"
            value={newPassword2}
            onChange={(event) => onNewPassword2Change(event.target.value)}
            required
            disabled={isChangingPassword}
          />
          <span id={newPassword2ErrorId} className={styles.fieldError} aria-live="polite">
            {newPassword2Error || "\u00A0"}
          </span>
        </label>

        <p
          id={formMessageId}
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
          <button
            className={clsx(styles.secondaryButton, styles.passwordSubmitButton)}
            type="submit"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? "Сохраняем..." : "Сохранить пароль"}
          </button>
        </div>
      </form>
    </section>
  );
}
