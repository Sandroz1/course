import { type FormEvent, useId, useState } from "react";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";
import { navigateTo } from "../utils/navigation";
import { toPath } from "../utils/slug";
import { AuthLayout } from "../components/layout/AuthLayout/AuthLayout";
import {
  firstFieldError,
  getApiFieldErrors,
  getFriendlyFormError,
  hasFieldErrors,
  type FieldErrorMap,
} from "../utils/formErrors";
import styles from "../components/layout/AuthLayout/AuthLayout.module.scss";

const registerFields = ["username", "password", "password2"] as const;
type RegisterField = (typeof registerFields)[number];

const registerFieldFallbacks: Record<RegisterField, string> = {
  username: "Проверьте логин.",
  password: "Проверьте пароль.",
  password2: "Проверьте повтор пароля.",
};

export function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<RegisterField>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usernameId = useId();
  const passwordId = useId();
  const passwordRepeatId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const passwordRepeatErrorId = useId();
  const formErrorId = useId();
  const usernameError = firstFieldError(fieldErrors, "username");
  const passwordError = firstFieldError(fieldErrors, "password");
  const password2Error = firstFieldError(fieldErrors, "password2");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorText("");
    setFieldErrors({});

    if (password !== password2) {
      setFieldErrors({ password2: ["Пароли не совпадают."] });
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ username, password, password2 });
      navigateTo("/profile", true);
    } catch (error) {
      const nextFieldErrors = getApiFieldErrors(error, registerFields, registerFieldFallbacks);

      setFieldErrors(nextFieldErrors);
      setErrorText(
        hasFieldErrors(nextFieldErrors)
          ? ""
          : getFriendlyFormError(error, "Не удалось создать аккаунт."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Регистрация"
      description="Создайте аккаунт, чтобы сохранять прогресс."
      footer={
        <>
          Уже есть аккаунт? <a href={toPath("/login")}>Войти</a>
        </>
      }
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        aria-describedby={formErrorId}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor={usernameId}>
            Логин
          </label>
          <input
            id={usernameId}
            className={styles.input}
            aria-invalid={Boolean(usernameError)}
            aria-describedby={usernameErrorId}
            autoComplete="username"
            placeholder="Введите логин"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span id={usernameErrorId} className={styles.fieldError} aria-live="polite">
            {usernameError || "\u00A0"}
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={passwordId}>
            Пароль
          </label>
          <input
            id={passwordId}
            className={styles.input}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordErrorId}
            autoComplete="new-password"
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span id={passwordErrorId} className={styles.fieldError} aria-live="polite">
            {passwordError || "\u00A0"}
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={passwordRepeatId}>
            Повтор пароля
          </label>
          <input
            id={passwordRepeatId}
            className={styles.input}
            aria-invalid={Boolean(password2Error)}
            aria-describedby={passwordRepeatErrorId}
            autoComplete="new-password"
            type="password"
            placeholder="Повтори пароль"
            value={password2}
            onChange={(event) => setPassword2(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span id={passwordRepeatErrorId} className={styles.fieldError} aria-live="polite">
            {password2Error || "\u00A0"}
          </span>
        </div>

        <p
          id={formErrorId}
          className={clsx(styles.formError, !errorText && styles.formErrorEmpty)}
          aria-live="polite"
        >
          {errorText || "\u00A0"}
        </p>

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Создание..." : "Создать аккаунт"}
        </button>
      </form>
    </AuthLayout>
  );
}
