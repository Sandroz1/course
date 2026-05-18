import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import {
  AI_USAGE_UPDATED_EVENT,
  formatAiUsage,
  getLocalAiUsage,
} from "../../lib/aiUsage";
import { changePassword, sendPhoneVerificationCode, verifyPhoneCode } from "../../lib/authApi";
import { getCachedCourseProgress, readCachedCourseProgress } from "../../lib/progressApi";
import clsx from "clsx";
import type { AiUsage, ProgressOverview } from "../../types/api";
import { navigateTo } from "../../utils/navigation";
import styles from "./ProfilePage.module.scss";

type PhoneVerifyFieldErrors = Partial<Record<"phone" | "code", string[]>>;
type PasswordFieldErrors = Partial<Record<"currentPassword" | "newPassword" | "newPassword2", string[]>>;
const RUSSIAN_PHONE_DIGITS_LENGTH = 10;

function firstError<T extends string>(errors: Partial<Record<T, string[]>>, field: T) {
  return errors[field]?.[0] ?? "";
}

function getCooldown(error: ApiError) {
  return typeof error.retryAfterSeconds === "number" ? Math.max(error.retryAfterSeconds, 1) : 0;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function getAiUsagePercent(usage: AiUsage) {
  const limit = Number.isFinite(usage.limit) && usage.limit > 0 ? usage.limit : 0;
  if (!limit) return 0;

  const remaining = Number.isFinite(usage.remaining) ? Math.min(Math.max(usage.remaining, 0), limit) : 0;
  return clampPercent((remaining / limit) * 100);
}

function extractRussianPhoneDigits(phone: string | null | undefined) {
  return phone?.startsWith("+7") ? phone.slice(2).replace(/\D/g, "").slice(0, RUSSIAN_PHONE_DIGITS_LENGTH) : "";
}

function sanitizeRussianPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits = digits.length > RUSSIAN_PHONE_DIGITS_LENGTH && digits.startsWith("7")
    ? digits.slice(1)
    : digits;
  return nationalDigits.slice(0, RUSSIAN_PHONE_DIGITS_LENGTH);
}

function buildRussianPhone(digits: string) {
  return digits.length === RUSSIAN_PHONE_DIGITS_LENGTH ? `+7${digits}` : "";
}

function formatRussianPhoneDigits(digits: string) {
  const firstPart = digits.slice(0, 3);
  const secondPart = digits.slice(3, 6);
  const thirdPart = digits.slice(6, 8);
  const fourthPart = digits.slice(8, 10);

  if (!firstPart) return "";

  let formatted = `(${firstPart}`;
  if (firstPart.length === 3) formatted += ")";
  if (secondPart) formatted += ` ${secondPart}`;
  if (thirdPart) formatted += `-${thirdPart}`;
  if (fourthPart) formatted += `-${fourthPart}`;
  return formatted;
}

export function ProfilePage() {
  const { user, isLoading, logout, refreshProfile, accessToken } = useAuth();
  const authKey = accessToken ?? "";
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneErrorText, setPhoneErrorText] = useState("");
  const [phoneFieldErrors, setPhoneFieldErrors] = useState<PhoneVerifyFieldErrors>({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordErrorText, setPasswordErrorText] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [studyProgress, setStudyProgress] = useState<ProgressOverview | null>(null);
  const [isStudyProgressLoading, setIsStudyProgressLoading] = useState(false);
  const [studyProgressError, setStudyProgressError] = useState("");
  const [aiUsage, setAiUsage] = useState<AiUsage>(() => getLocalAiUsage(user?.id));
  const phoneError = firstError(phoneFieldErrors, "phone");
  const codeError = firstError(phoneFieldErrors, "code");
  const currentPasswordError = firstError(passwordFieldErrors, "currentPassword");
  const newPasswordError = firstError(passwordFieldErrors, "newPassword");
  const newPassword2Error = firstError(passwordFieldErrors, "newPassword2");

  useEffect(() => {
    setPhoneDigits(extractRussianPhoneDigits(user?.phone));
  }, [user]);

  useEffect(() => {
    setAiUsage(getLocalAiUsage(user?.id));

    function syncUsage() {
      setAiUsage(getLocalAiUsage(user?.id));
    }

    window.addEventListener(AI_USAGE_UPDATED_EVENT, syncUsage);

    return () => window.removeEventListener(AI_USAGE_UPDATED_EVENT, syncUsage);
  }, [user?.id]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setCooldownSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!user || !authKey) {
      setStudyProgress(null);
      setIsStudyProgressLoading(false);
      setStudyProgressError("");
      return;
    }

    let cancelled = false;
    const cachedProgress = readCachedCourseProgress(authKey);

    if (cachedProgress) {
      setStudyProgress(cachedProgress);
      setIsStudyProgressLoading(false);
      setStudyProgressError("");
      return;
    }

    async function loadStudyProgress() {
      setIsStudyProgressLoading(true);
      setStudyProgressError("");

      try {
        const progress = await getCachedCourseProgress(authKey);
        if (!cancelled) {
          setStudyProgress(progress);
        }
      } catch {
        if (!cancelled) {
          setStudyProgress(null);
          setStudyProgressError("Прогресс временно недоступен.");
        }
      } finally {
        if (!cancelled) {
          setIsStudyProgressLoading(false);
        }
      }
    }

    void loadStudyProgress();

    return () => {
      cancelled = true;
    };
  }, [authKey, user]);

  async function handleSendCode(event?: FormEvent) {
    event?.preventDefault();
    setPhoneMessage("");
    setPhoneErrorText("");
    setPhoneFieldErrors({});

    const phone = buildRussianPhone(phoneDigits);
    if (phone && user?.phone === phone && user.is_phone_verified) return;

    if (!phone) {
      setPhoneErrorText("Введите 10 цифр российского номера.");
      setPhoneFieldErrors({ phone: ["Введите 10 цифр российского номера."] });
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await sendPhoneVerificationCode(phone);
      setPhoneMessage(response.message || "Код отправлен.");
      setPhoneCode("");
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

    const phone = buildRussianPhone(phoneDigits);
    if (!phone) {
      setPhoneErrorText("Введите 10 цифр российского номера.");
      setPhoneFieldErrors({ phone: ["Введите 10 цифр российского номера."] });
      return;
    }

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

  if (isLoading && !user) {
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
          <p className={clsx(styles.formMessage, styles.formError)}>Не удалось загрузить профиль.</p>
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

  const phone = buildRussianPhone(phoneDigits);
  const isPhoneComplete = phoneDigits.length === RUSSIAN_PHONE_DIGITS_LENGTH;
  const isPhoneChanged = phone !== (user.phone ?? "");
  const isPhoneVerified = Boolean(user.phone && user.is_phone_verified && !isPhoneChanged);
  const phoneStatusLabel = isPhoneVerified ? "Подтверждён" : isPhoneComplete ? "Нужен код" : "Не подтверждён";
  const phoneHelpText = isPhoneVerified
    ? "Номер подтверждён и привязан к аккаунту."
    : isPhoneComplete
      ? "Отправьте SMS-код и подтвердите номер."
      : "Введите 10 цифр российского номера после +7.";
  const canSendCode = !isPhoneVerified && isPhoneComplete && cooldownSeconds === 0 && !isSendingCode;
  const canVerifyCode = isPhoneComplete && phoneCode.length === 6 && !isVerifyingCode;
  const completedLessonsCount = studyProgress?.lessons.filter((lesson) => lesson.is_completed).length ?? 0;
  const openedLessonsCount = studyProgress?.lessons.length ?? 0;
  const solvedTasksCount = studyProgress?.tasks.filter((task) => task.status === "solved").length ?? 0;
  const activeTasksCount = studyProgress?.tasks.filter((task) => task.status === "in_progress").length ?? 0;
  const aiStatusText = isPhoneVerified
    ? "Можно задавать вопросы AI."
    : "Подтверди телефон, чтобы открыть AI.";
  const displayedAiUsage = isPhoneVerified ? aiUsage : { ...aiUsage, remaining: 0 };
  const aiUsagePercent = getAiUsagePercent(displayedAiUsage);

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Аккаунт</p>
        <h1 className={styles.title}>Профиль</h1>
        <p className={styles.description}>Логин: {user.username}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={clsx(styles.card, styles.phoneCard)}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <h2 className={styles.cardTitle}>Телефон</h2>
                <span
                  className={clsx(
                    styles.phoneStatus,
                    isPhoneVerified ? styles.phoneStatusVerified : styles.phoneStatusPending,
                  )}
                >
                  {phoneStatusLabel}
                </span>
              </div>
              <p className={styles.mutedText}>{phoneHelpText}</p>
            </div>

            <form className={clsx(styles.form, styles.phoneForm)} onSubmit={handleSendCode} aria-busy={isSendingCode}>
              <div className={styles.phoneControls}>
                <label className={clsx(styles.field, styles.phoneField)}>
                  <span className={styles.label}>Номер</span>
                  <div
                    className={clsx(styles.phoneInputGroup, phoneError && styles.phoneInputGroupInvalid)}
                  >
                    <span className={styles.phonePrefix}>+7</span>
                    <input
                      className={styles.input}
                      aria-invalid={Boolean(phoneError)}
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={18}
                      type="tel"
                      value={formatRussianPhoneDigits(phoneDigits)}
                      onChange={(event) => setPhoneDigits(sanitizeRussianPhoneDigits(event.target.value))}
                      placeholder="(999) 123-45-67"
                      disabled={isSendingCode}
                    />
                    <span className={styles.phoneCounter}>{phoneDigits.length}/10</span>
                  </div>
                  <span className={styles.fieldError} aria-live="polite">
                    {phoneError || "\u00A0"}
                  </span>
                </label>

                {!isPhoneVerified && (
                  <button
                    className={clsx(styles.secondaryButton, styles.phoneSendButton)}
                    type="submit"
                    disabled={!canSendCode}
                  >
                    {isSendingCode
                      ? "Отправляем..."
                      : cooldownSeconds > 0
                        ? `Повтор через ${cooldownSeconds} с`
                        : "Отправить SMS-код"}
                  </button>
                )}
              </div>

              {(phoneErrorText || phoneMessage) && (
                <p
                  className={clsx(
                    styles.formMessage,
                    phoneErrorText && styles.formError,
                    phoneMessage && styles.formSuccess,
                  )}
                  aria-live="polite"
                >
                  {phoneErrorText || phoneMessage}
                </p>
              )}
            </form>

            {!isPhoneVerified && (
              <form
                className={clsx(styles.form, styles.phoneCodeForm)}
                onSubmit={handleVerifyCode}
                aria-busy={isVerifyingCode}
              >
                <label className={styles.field}>
                  <span className={styles.label}>Код из SMS</span>
                  <input
                    className={styles.input}
                    aria-invalid={Boolean(codeError)}
                    inputMode="numeric"
                    maxLength={6}
                    value={phoneCode}
                    onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    disabled={isVerifyingCode}
                  />
                  <span className={styles.fieldError} aria-live="polite">
                    {codeError || "\u00A0"}
                  </span>
                </label>

                <div className={styles.actions}>
                  <button
                    className={clsx(styles.secondaryButton, styles.phoneVerifyButton)}
                    type="submit"
                    disabled={!canVerifyCode}
                  >
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
        </div>

        <div className={styles.sideColumn}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>AI-лимит</h2>
            <div
              className={clsx(
                styles.aiStatus,
                isPhoneVerified ? styles.aiStatusAvailable : styles.aiStatusBlocked,
              )}
            >
              <strong>{isPhoneVerified ? "Доступен" : "Недоступен"}</strong>
              <span>{aiStatusText}</span>
            </div>
            <div className={styles.aiLimit}>
              <span>{formatAiUsage(displayedAiUsage)}</span>
              <div aria-hidden="true">
                <span
                  style={{
                    width: `${aiUsagePercent}%`,
                  }}
                />
              </div>
            </div>
          </section>

          <section className={clsx(styles.card, styles.progressCard)}>
            <h2 className={styles.cardTitle}>Прогресс</h2>
            {isStudyProgressLoading ? (
              <p className={clsx(styles.mutedText, styles.progressState)}>Загружаем прогресс...</p>
            ) : studyProgressError ? (
              <p className={clsx(styles.formMessage, styles.formError, styles.progressState)}>
                {studyProgressError}
              </p>
            ) : (
              <div className={styles.progressStats}>
                <div>
                  <strong>{completedLessonsCount}</strong>
                  <span>уроков пройдено</span>
                </div>
                <div>
                  <strong>{openedLessonsCount}</strong>
                  <span>уроков открыто</span>
                </div>
                <div>
                  <strong>{solvedTasksCount}</strong>
                  <span>задач решено</span>
                </div>
                <div>
                  <strong>{activeTasksCount}</strong>
                  <span>задач в работе</span>
                </div>
              </div>
            )}
          </section>

          <section className={clsx(styles.card, styles.sessionCard)}>
            <h2 className={styles.cardTitle}>Сессия</h2>
            <button className={styles.dangerButton} type="button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </section>
        </div>
      </div>
    </article>
  );
}
