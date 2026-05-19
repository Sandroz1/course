import { type FormEvent, useId, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import clsx from "clsx";
import { navigateTo } from "../utils/navigation";
import { toPath } from "../utils/slug";
import { AuthLayout } from "../components/layout/AuthLayout/AuthLayout";
import styles from "../components/layout/AuthLayout/AuthLayout.module.scss";

type LoginFieldErrors = Partial<Record<"username" | "password", string[]>>;

function firstError(errors: LoginFieldErrors, field: keyof LoginFieldErrors) {
  return errors[field]?.[0] ?? "";
}

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usernameId = useId();
  const passwordId = useId();
  const usernameError = firstError(fieldErrors, "username");
  const passwordError = firstError(fieldErrors, "password");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorText("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigateTo("/profile", true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorText(error.message);
        setFieldErrors(error.fields ?? {});
      } else {
        setErrorText("Не удалось войти.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Вход"
      description="Для сохранения прогресса и доступа к AI-помощнику."
      footer={
        <>
          Нет аккаунта? <a href={toPath("/register")}>Зарегистрироваться</a>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={usernameId}>
            Логин
          </label>
          <input
            id={usernameId}
            className={styles.input}
            aria-invalid={Boolean(usernameError)}
            autoComplete="username"
            placeholder="Введите логин"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span className={styles.fieldError} aria-live="polite">
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
            autoComplete="current-password"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span className={styles.fieldError} aria-live="polite">
            {passwordError || "\u00A0"}
          </span>
        </div>

        <p className={clsx(styles.formError, !errorText && styles.formErrorEmpty)} aria-live="polite">
          {errorText || "\u00A0"}
        </p>

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Входим..." : "Войти"}
        </button>
      </form>
    </AuthLayout>
  );
}
