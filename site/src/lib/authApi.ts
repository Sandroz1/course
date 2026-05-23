import { apiRequest } from "./api";
import type {
  ChangePasswordRequest,
  MessageResponse,
  PhoneSendCodeRequest,
  PhoneVerifyRequest,
  PhoneVerifyResponse,
} from "../types/api";

export function sendPhoneVerificationCode(phone: string) {
  return apiRequest<MessageResponse>("/auth/phone/send-code/", {
    method: "POST",
    body: { phone } satisfies PhoneSendCodeRequest,
  });
}

export function verifyPhoneCode(phone: string, code: string) {
  return apiRequest<PhoneVerifyResponse>("/auth/phone/verify/", {
    method: "POST",
    body: { phone, code } satisfies PhoneVerifyRequest,
  });
}

export function changePassword(payload: ChangePasswordRequest) {
  return apiRequest<MessageResponse>("/auth/change-password/", {
    method: "POST",
    body: payload,
  });
}
