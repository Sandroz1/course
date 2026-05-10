import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { navigateTo } from "../utils/navigation";
import { toPath } from "../utils/slug";

export function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorText("");

    if (password !== password2) {
      setErrorText("Пароли не совпадают.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ username, phone, password, password2 });
      navigateTo("/profile", true);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Не удалось зарегистрироваться.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="reading-page compact-page auth-page">
      <header className="page-header">
        <p className="eyebrow">Аккаунт</p>
        <h1>Регистрация</h1>
        <p className="lead">Создай аккаунт. Позже он будет использоваться для прогресса и личного кабинета.</p>
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
            Телефон
            <input
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+7..."
            />
          </label>

          <label className="field">
            Пароль
            <input
              autoComplete="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Повтор пароля
            <input
              autoComplete="new-password"
              type="password"
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
              required
            />
          </label>

          {errorText ? <p className="auth-error">{errorText}</p> : null}

          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Создаём..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="auth-note">
          Уже есть аккаунт? <a href={toPath("/login")}>Войти</a>
        </p>
      </section>
    </article>
  );
}
