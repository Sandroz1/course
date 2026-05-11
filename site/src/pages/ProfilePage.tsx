import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { changePassword, sendPhoneVerificationCode, verifyPhoneCode } from "../lib/authApi";
import { classNames } from "../shared/lib/classNames";
import { navigateTo } from "../utils/navigation";
import styles from "./ProfilePage.module.scss";

type ProfileFieldErrors = Partial<Record<"phone", string[]>>;
type PhoneVerifyFieldErrors = Partial<Record<"phone" | "code", string[]>>;
type PasswordFieldErrors = Partial<Record<"currentPassword" | "newPassword" | "newPassword2", string[]>>;

function firstError<T extends string>(errors: Partial<Record<T, string[]>>, field: T) {
  return errors[field]?.[0] ?? "";
}

function getCooldown(error: ApiError) {
  return typeof error.retryAfterSeconds === "number" ? Math.max(error.retryAfterSeconds, 1) : 0;
}

export function ProfilePage() {
  const { user, isLoading, logout, refreshProfile, updateProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [messageText, setMessageText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneErrorText, setPhoneErrorText] = useState("");
  const [phoneFieldErrors, setPhoneFieldErrors] = useState<PhoneVerifyFieldErrors>({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordErrorText, setPasswordErrorText] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const phoneError = firstError(fieldErrors, "phone");
  const phoneVerifyError = firstError(phoneFieldErrors, "phone");
  const codeError = firstError(phoneFieldErrors, "code");
  const currentPasswordError = firstError(passwordFieldErrors, "currentPassword");
  const newPasswordError = firstError(passwordFieldErrors, "newPassword");
  const newPassword2Error = firstError(passwordFieldErrors, "newPassword2");

  useEffect(() => {
    setPhone(user?.phone ?? "");
  }, [user]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setCooldownSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setMessageText("");
    setErrorText("");
    setFieldErrors({});
    setIsSaving(true);

    try {
      await updateProfile({ phone });
      setPhoneCode("");
      setMessageText("Профиль обновлён.");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorText(error.message);
        setFieldErrors(error.fields ?? {});
      } else {
        setErrorText("Не удалось обновить профиль.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendCode() {
    setPhoneMessage("");
    setPhoneErrorText("");
    setPhoneFieldErrors({});

    if (!phone.trim()) {
      setPhoneErrorText("Введите телефон.");
      setPhoneFieldErrors({ phone: ["Введите телефон."] });
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await sendPhoneVerificationCode(phone);
      setPhoneMessage(response.message || "Код отправлен.");
      setCooldownSeconds(60);
    } catch (error) {
      if (error instanceof ApiError) {
        setPhoneErrorText(error.message);
        setPhoneFieldErrors(error.fields ?? {});
        const retryAfterSeconds = getCooldown(error);
        if (retryAfterSeconds) {
          setCooldownSeconds(retryAfterSeconds);
        }
      } else {
        setPhoneErrorText("Не удалось отправить код.");
      }
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    setPhoneMessage("");
    setPhoneErrorText("");
    setPhoneFieldErrors({});
    setIsVerifyingCode(true);

    try {
      const response = await verifyPhoneCode(phone, phoneCode);
      setPhoneMessage(response.message || "Телефон подтверждён.");
      setPhoneCode("");
      await refreshProfile();
    } catch (error) {
      if (error instanceof ApiError) {
        setPhoneErrorText(error.message);
        setPhoneFieldErrors(error.fields ?? {});
      } else {
        setPhoneErrorText("Не удалось подтвердить телефон.");
      }
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordErrorText("");
    setPasswordFieldErrors({});

    if (newPassword !== newPassword2) {
      setPasswordErrorText("Проверь повтор нового пароля.");
      setPasswordFieldErrors({ newPassword2: ["Пароли не совпадают."] });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await changePassword({ currentPassword, newPassword, newPassword2 });
      setPasswordMessage(response.message || "Пароль изменён.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordErrorText(error.message);
        setPasswordFieldErrors(error.fields ?? {});
      } else {
        setPasswordErrorText("Не удалось изменить пароль.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigateTo("/login", true);
  }

  if (isLoading) {
    return (
      <article className={styles.root}>
        <section className={styles.card}>
          <p>Загружаем профиль...</p>
        </section>
      </article>
    );
  }

  if (!user) {
    return (
      <article className={styles.root}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Аккаунт</p>
          <h1 className={styles.title}>Профиль</h1>
        </header>
        <section className={styles.card}>
          <p className={classNames(styles.formMessage, styles.formError)}>Не удалось загрузить профиль.</p>
          <div className={styles.actions}>
            <button className={styles.secondaryButton} type="button" onClick={() => void refreshProfile()}>
              Повторить
            </button>
            <button className={styles.dangerButton} type="button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </div>
        </section>
      </article>
    );
  }

  const isPhoneChanged = phone.trim() !== (user.phone ?? "");
  const isPhoneVerified = Boolean(user.phone && user.is_phone_verified && !isPhoneChanged);
  const canSendCode = Boolean(phone.trim()) && cooldownSeconds === 0 && !isSendingCode;

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Аккаунт</p>
        <h1 className={styles.title}>Настройки</h1>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Данные аккаунта</h2>
            </div>

            <div className={styles.form}>
              <label className={styles.field}>
                <span className={styles.label}>Логин</span>
                <input className={styles.input} value={user.username} readOnly />
              </label>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Телефон</h2>
            </div>

            <form className={styles.form} onSubmit={handleSave} aria-busy={isSaving}>
              <label className={styles.field}>
                <span className={styles.label}>Телефон</span>
                <input
                  className={styles.input}
                  aria-invalid={Boolean(phoneError)}
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={isSaving}
                />
                <span className={styles.fieldError} aria-live="polite">
                  {phoneError || "\u00A0"}
                </span>
              </label>

              <div
                className={classNames(
                  styles.phoneStatus,
                  isPhoneVerified ? styles.phoneStatusVerified : styles.phoneStatusPending,
                )}
              >
                <span>Статус телефона</span>
                <strong>{isPhoneVerified ? "Подтверждён" : "Не подтверждён"}</strong>
              </div>

              <p
                className={classNames(
                  styles.formMessage,
                  errorText && styles.formError,
                  messageText && styles.formSuccess,
                  !errorText && !messageText && styles.formMessageEmpty,
                )}
                aria-live="polite"
              >
                {errorText || messageText || "\u00A0"}
              </p>

              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit" disabled={isSaving}>
                  {isSaving ? "Сохраняем..." : "Сохранить"}
                </button>
                {!isPhoneVerified && (
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={!canSendCode || isSaving}
                    onClick={() => void handleSendCode()}
                  >
                    {isSendingCode
                      ? "Отправляем..."
                      : cooldownSeconds > 0
                        ? `Повтор через ${cooldownSeconds} с`
                        : "Отправить код"}
                  </button>
                )}
              </div>
            </form>

            {!isPhoneVerified && (
              <form className={styles.form} onSubmit={handleVerifyCode} aria-busy={isVerifyingCode}>
                <p
                  className={classNames(
                    styles.formMessage,
                    phoneErrorText && styles.formError,
                    phoneMessage && styles.formSuccess,
                    !phoneErrorText && !phoneMessage && styles.formMessageEmpty,
                  )}
                  aria-live="polite"
                >
                  {phoneErrorText || phoneMessage || "\u00A0"}
                </p>

                <label className={styles.field}>
                  <span className={styles.label}>Код из SMS</span>
                  <input
                    className={styles.input}
                    aria-invalid={Boolean(codeError || phoneVerifyError)}
                    inputMode="numeric"
                    maxLength={6}
                    value={phoneCode}
                    onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    disabled={isVerifyingCode}
                  />
                  <span className={styles.fieldError} aria-live="polite">
                    {codeError || phoneVerifyError || "\u00A0"}
                  </span>
                </label>

                <div className={styles.actions}>
                  <button className={styles.secondaryButton} type="submit" disabled={isVerifyingCode}>
                    {isVerifyingCode ? "Проверяем..." : "Подтвердить"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Смена пароля</h2>
            </div>

            <form className={styles.form} onSubmit={handleChangePassword} aria-busy={isChangingPassword}>
              <label className={styles.field}>
                <span className={styles.label}>Текущий пароль</span>
                <input
                  className={styles.input}
                  aria-invalid={Boolean(currentPasswordError)}
                  autoComplete="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
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
                  onChange={(event) => setNewPassword(event.target.value)}
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
                  onChange={(event) => setNewPassword2(event.target.value)}
                  required
                  disabled={isChangingPassword}
                />
                <span className={styles.fieldError} aria-live="polite">
                  {newPassword2Error || "\u00A0"}
                </span>
              </label>

              <p
                className={classNames(
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
                <button className={styles.primaryButton} type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? "Меняем..." : "Сменить пароль"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className={styles.sideColumn}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Прогресс</h2>
            <p className={styles.mutedText}>Уроки и задачи появятся здесь.</p>
          </section>

          <section className={classNames(styles.card, styles.sessionCard)}>
            <div>
              <h2 className={styles.cardTitle}>Выход</h2>
              <p className={styles.mutedText}>Завершить текущую сессию.</p>
            </div>
            <button className={styles.dangerButton} type="button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </section>
        </div>
      </div>
    </article>
  );
}
