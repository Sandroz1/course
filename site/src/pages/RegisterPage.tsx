import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { classNames } from "../shared/lib/classNames";
import { navigateTo } from "../utils/navigation";
import { toPath } from "../utils/slug";
import { AuthLayout } from "../components/layout/AuthLayout/AuthLayout";
import styles from "../components/layout/AuthLayout/AuthLayout.module.scss";

type RegisterFieldErrors = Partial<Record<"username" | "phone" | "password" | "password2", string[]>>;

function firstError(errors: RegisterFieldErrors, field: keyof RegisterFieldErrors) {
  return errors[field]?.[0] ?? "";
}

export function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const usernameError = firstError(fieldErrors, "username");
  const phoneError = firstError(fieldErrors, "phone");
  const passwordError = firstError(fieldErrors, "password");
  const password2Error = firstError(fieldErrors, "password2");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorText("");
    setFieldErrors({});

    if (password !== password2) {
      setErrorText("Проверь повтор пароля.");
      setFieldErrors({ password2: ["Пароли не совпадают."] });
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ username, phone, password, password2 });
      navigateTo("/profile", true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorText(error.message);
        setFieldErrors(error.fields ?? {});
      } else {
        setErrorText("Не удалось зарегистрироваться.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Регистрация"
      description="Аккаунт для прогресса и AI."
      footer={
        <>
          Уже есть аккаунт? <a href={toPath("/login")}>Войти</a>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label className={styles.field}>
          <span className={styles.label}>Логин</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(usernameError)}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span className={styles.fieldError} aria-live="polite">
            {usernameError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(phoneError)}
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+7..."
            disabled={isSubmitting}
          />
          <span className={styles.fieldError} aria-live="polite">
            {phoneError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пароль</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span className={styles.fieldError} aria-live="polite">
            {passwordError || "\u00A0"}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Повтор пароля</span>
          <input
            className={styles.input}
            aria-invalid={Boolean(password2Error)}
            autoComplete="new-password"
            type="password"
            value={password2}
            onChange={(event) => setPassword2(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <span className={styles.fieldError} aria-live="polite">
            {password2Error || "\u00A0"}
          </span>
        </label>

        <p className={classNames(styles.formError, !errorText && styles.formErrorEmpty)} aria-live="polite">
          {errorText || "\u00A0"}
        </p>

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Создание..." : "Создать аккаунт"}
        </button>
      </form>
    </AuthLayout>
  );
}
