export const RUSSIAN_PHONE_DIGITS_LENGTH = 10;

export function extractRussianPhoneDigits(phone: string | null | undefined) {
  return phone?.startsWith("+7")
    ? phone.slice(2).replace(/\D/g, "").slice(0, RUSSIAN_PHONE_DIGITS_LENGTH)
    : "";
}

export function sanitizeRussianPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits =
    digits.length > RUSSIAN_PHONE_DIGITS_LENGTH && digits.startsWith("7")
      ? digits.slice(1)
      : digits;
  return nationalDigits.slice(0, RUSSIAN_PHONE_DIGITS_LENGTH);
}

export function buildRussianPhone(digits: string) {
  return digits.length === RUSSIAN_PHONE_DIGITS_LENGTH ? `+7${digits}` : "";
}

export function formatRussianPhoneDigits(digits: string) {
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

export function countDigitsBefore(value: string, position: number) {
  return value.slice(0, position).replace(/\D/g, "").length;
}

export function getCaretPositionForDigitOffset(value: string, digitOffset: number) {
  if (digitOffset <= 0) return value.startsWith("(") ? 1 : 0;

  let digitsSeen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (!/\d/.test(value[index])) continue;

    digitsSeen += 1;
    if (digitsSeen >= digitOffset) return index + 1;
  }

  return value.length;
}
