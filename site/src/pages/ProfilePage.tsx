import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { navigateTo } from "../utils/navigation";

export function ProfilePage() {
  const { user, isLoading, logout, refreshProfile, updateProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [messageText, setMessageText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPhone(user?.phone ?? "");
  }, [user]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setMessageText("");
    setErrorText("");
    setIsSaving(true);

    try {
      await updateProfile({ phone });
      setMessageText("Профиль обновлён.");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Не удалось обновить профиль.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigateTo("/login", true);
  }

  if (isLoading) {
    return (
      <article className="reading-page compact-page auth-page">
        <section className="panel auth-card">
          <p>Загружаем профиль...</p>
        </section>
      </article>
    );
  }

  if (!user) {
    return (
      <article className="reading-page compact-page auth-page">
        <header className="page-header">
          <p className="eyebrow">Аккаунт</p>
          <h1>Профиль</h1>
        </header>
        <section className="panel auth-card">
          <p className="auth-error">Не удалось загрузить профиль.</p>
          <div className="actions">
            <button className="button" type="button" onClick={() => void refreshProfile()}>
              Повторить
            </button>
            <button className="button button--ghost" type="button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </div>
        </section>
      </article>
    );
  }

  return (
    <article className="reading-page compact-page auth-page">
      <header className="page-header">
        <p className="eyebrow">Аккаунт</p>
        <h1>Профиль</h1>
        <p className="lead">Здесь будут настройки аккаунта и прогресс по курсу.</p>
      </header>

      <section className="panel auth-card">
        <form className="auth-form" onSubmit={handleSave}>
          <label className="field">
            Логин
            <input value={user.username} readOnly />
          </label>

          <label className="field">
            Телефон
            <input autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>

          <div className="profile-status">
            <span>Телефон</span>
            <strong>{user.is_phone_verified ? "подтверждён" : "не подтверждён"}</strong>
          </div>

          {messageText ? <p className="auth-success">{messageText}</p> : null}
          {errorText ? <p className="auth-error">{errorText}</p> : null}

          <div className="actions">
            <button className="button button--primary" type="submit" disabled={isSaving}>
              {isSaving ? "Сохраняем..." : "Сохранить"}
            </button>
            <button className="button button--ghost" type="button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </div>
        </form>
      </section>
    </article>
  );
}
