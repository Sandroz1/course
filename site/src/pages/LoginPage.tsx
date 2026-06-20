import { type FormEvent, useId, useState } from "react";
import { appRoutes } from "../app/routes";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";
import { navigateTo } from "../utils/navigation";
import { toPath } from "../utils/slug";
import { AuthLayout } from "../components/layout/AuthLayout/AuthLayout";
import { Button } from "../components/shared/ActionButton/ActionButton";
import {
  firstFieldError,
  getApiFieldErrors,
  getFriendlyFormError,
  hasFieldErrors,
  type FieldErrorMap,
} from "../utils/formErrors";
import styles from "../components/layout/AuthLayout/AuthLayout.module.scss";

const loginFields = ["username", "password"] as const;
type LoginField = (typeof loginFields)[number];

const loginFieldFallbacks: Record<LoginField, string> = {
  username: "Проверьте логин.",
  password: "Проверьте пароль.",
};
const PASSWORD_CHANGED_STATUS_MESSAGE = "Пароль изменён. Войдите снова.";

function getInitialStatusText() {
  return new URLSearchParams(window.location.search).get("passwordChanged") === "1"
    ? PASSWORD_CHANGED_STATUS_MESSAGE
    : "";
}

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusText, setStatusText] = useState(getInitialStatusText);
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<LoginField>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usernameId = useId();
  const passwordId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const usernameError = firstFieldError(fieldErrors, "username");
  const passwordError = firstFieldError(fieldErrors, "password");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatusText("");
    setErrorText("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigateTo(appRoutes.profile, true);
    } catch (error) {
      const nextFieldErrors = getApiFieldErrors(error, loginFields, loginFieldFallbacks);

      setFieldErrors(nextFieldErrors);
      setErrorText(
        hasFieldErrors(nextFieldErrors) ? "" : getFriendlyFormError(error, "Не удалось войти."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const formMessage = errorText || statusText;

  return (
    <AuthLayout
      title="Вход"
      description="Войдите, чтобы продолжить обучение и сохранить прогресс."
      footer={
        <>
          Нет аккаунта? <a href={toPath(appRoutes.register)}>Зарегистрироваться</a>
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
            placeholder="Логин"
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
            autoComplete="current-password"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span id={passwordErrorId} className={styles.fieldError} aria-live="polite">
            {passwordError || "\u00A0"}
          </span>
        </div>

        <p
          id={formErrorId}
          className={clsx(
            styles.formError,
            statusText && !errorText && styles.formSuccess,
            !formMessage && styles.formErrorEmpty,
          )}
          aria-live="polite"
        >
          {formMessage || "\u00A0"}
        </p>

        <Button className={styles.submit} type="submit" disabled={isSubmitting} variant="primary">
          {isSubmitting ? "Входим..." : "Войти"}
        </Button>
      </form>
    </AuthLayout>
  );
}
