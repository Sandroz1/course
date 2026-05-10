import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { navigateTo } from "../utils/navigation";
import { toPath } from "../utils/slug";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorText("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigateTo("/profile", true);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="reading-page compact-page auth-page">
      <header className="page-header">
        <p className="eyebrow">Аккаунт</p>
        <h1>Вход</h1>
        <p className="lead">Войди, чтобы позже сохранять прогресс и пользоваться личными функциями.</p>
      </header>

      <section className="panel auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            Логин
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Пароль
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorText ? <p className="auth-error">{errorText}</p> : null}

          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="auth-note">
          Нет аккаунта? <a href={toPath("/register")}>Зарегистрироваться</a>
        </p>
      </section>
    </article>
  );
}
