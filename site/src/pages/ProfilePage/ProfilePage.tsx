import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import {
  AI_USAGE_UPDATED_EVENT,
  getLocalAiUsage,
} from "../../lib/aiUsage";
import { changePassword, sendPhoneVerificationCode, verifyPhoneCode } from "../../lib/authApi";
import { getCachedCourseProgress, readCachedCourseProgress } from "../../lib/progressApi";
import clsx from "clsx";
import type { AiUsage, ProgressOverview } from "../../types/api";
import { navigateTo } from "../../utils/navigation";
import { AiUsagePanel } from "./components/AiUsagePanel";
import { PasswordChangePanel } from "./components/PasswordChangePanel";
import { PhoneVerificationPanel } from "./components/PhoneVerificationPanel";
import { ProgressSummaryPanel } from "./components/ProgressSummaryPanel";
import { SessionPanel } from "./components/SessionPanel";
import {
  buildRussianPhone,
  countDigitsBefore,
  extractRussianPhoneDigits,
  getCaretPositionForDigitOffset,
  RUSSIAN_PHONE_DIGITS_LENGTH,
  sanitizeRussianPhoneDigits,
} from "./phoneFormat";
import styles from "./ProfilePage.module.scss";

type PhoneVerifyFieldErrors = Partial<Record<"phone" | "code", string[]>>;
type PasswordFieldErrors = Partial<Record<"currentPassword" | "newPassword" | "newPassword2", string[]>>;

function firstError<T extends string>(errors: Partial<Record<T, string[]>>, field: T) {
  return errors[field]?.[0] ?? "";
}

function getCooldown(error: ApiError) {
  return typeof error.retryAfterSeconds === "number" ? Math.max(error.retryAfterSeconds, 1) : 0;
}

export function ProfilePage() {
  const { user, isLoading, logout, refreshProfile, accessToken } = useAuth();
  const authKey = accessToken ?? "";
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const phoneCaretDigitOffsetRef = useRef<number | null>(null);
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

  useLayoutEffect(() => {
    const digitOffset = phoneCaretDigitOffsetRef.current;
    const input = phoneInputRef.current;
    if (digitOffset === null || !input) return;

    const caretPosition = getCaretPositionForDigitOffset(input.value, digitOffset);
    input.setSelectionRange(caretPosition, caretPosition);
    phoneCaretDigitOffsetRef.current = null;
  }, [phoneDigits]);

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

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDigits = sanitizeRussianPhoneDigits(event.target.value);
    const selectionStart = event.target.selectionStart ?? event.target.value.length;
    phoneCaretDigitOffsetRef.current = Math.min(
      countDigitsBefore(event.target.value, selectionStart),
      nextDigits.length,
    );
    setPhoneDigits(nextDigits);
  }

  function handlePhoneKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" && event.key !== "Delete") return;

    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    if (selectionStart !== selectionEnd) return;

    const isBackspace = event.key === "Backspace";
    const targetChar = isBackspace ? input.value[selectionStart - 1] : input.value[selectionStart];
    if (!targetChar || /\d/.test(targetChar)) return;

    const digitsBefore = countDigitsBefore(input.value, selectionStart);
    const digitIndexToRemove = isBackspace ? digitsBefore - 1 : digitsBefore;
    if (digitIndexToRemove < 0 || digitIndexToRemove >= phoneDigits.length) return;

    event.preventDefault();
    phoneCaretDigitOffsetRef.current = digitIndexToRemove;
    setPhoneDigits((digits) => digits.slice(0, digitIndexToRemove) + digits.slice(digitIndexToRemove + 1));
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
  const aiStatusText = isPhoneVerified
    ? "Можно задавать вопросы AI."
    : "Подтверди телефон, чтобы открыть AI.";

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Аккаунт</p>
        <h1 className={styles.title}>Профиль</h1>
        <p className={styles.description}>Логин: {user.username}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <PhoneVerificationPanel
            phoneInputRef={phoneInputRef}
            phoneDigits={phoneDigits}
            phoneCode={phoneCode}
            phoneError={phoneError}
            codeError={codeError}
            phoneErrorText={phoneErrorText}
            phoneMessage={phoneMessage}
            phoneStatusLabel={phoneStatusLabel}
            phoneHelpText={phoneHelpText}
            isPhoneVerified={isPhoneVerified}
            isSendingCode={isSendingCode}
            isVerifyingCode={isVerifyingCode}
            cooldownSeconds={cooldownSeconds}
            canSendCode={canSendCode}
            canVerifyCode={canVerifyCode}
            onSendCode={handleSendCode}
            onVerifyCode={handleVerifyCode}
            onPhoneChange={handlePhoneChange}
            onPhoneKeyDown={handlePhoneKeyDown}
            onPhoneCodeChange={setPhoneCode}
          />

          <PasswordChangePanel
            currentPassword={currentPassword}
            newPassword={newPassword}
            newPassword2={newPassword2}
            currentPasswordError={currentPasswordError}
            newPasswordError={newPasswordError}
            newPassword2Error={newPassword2Error}
            passwordErrorText={passwordErrorText}
            passwordMessage={passwordMessage}
            isChangingPassword={isChangingPassword}
            onChangePassword={handleChangePassword}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onNewPassword2Change={setNewPassword2}
          />
        </div>

        <div className={styles.sideColumn}>
          <AiUsagePanel
            usage={aiUsage}
            isPhoneVerified={isPhoneVerified}
            statusText={aiStatusText}
          />
          <ProgressSummaryPanel
            progress={studyProgress}
            isLoading={isStudyProgressLoading}
            error={studyProgressError}
          />
          <SessionPanel onLogout={() => void handleLogout()} />
        </div>
      </div>
    </article>
  );
}
