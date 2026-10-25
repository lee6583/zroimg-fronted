import { request } from "@/utils/request";
import type {
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  LogoutAccountResponse,
  RegisterAccountRequest,
  RegisterAccountResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SendPasswordResetCodeRequest,
  SendPasswordResetCodeResponse,
  SendRegisterCodeRequest,
  SendRegisterCodeResponse,
  SliderChallengeRequest,
  SliderChallengeResponse,
  SliderTokenRequest,
  SliderTokenResponse,
} from "@/types/auth";

function getSliderChallenge(data: SliderChallengeRequest) {
  return request<SliderChallengeResponse>({
    url: "/api/auth/user/slider-challenge",
    method: "POST",
    data,
  });
}

function getSliderToken(data: SliderTokenRequest) {
  return request<SliderTokenResponse>({
    url: "/api/auth/user/slider-token",
    method: "POST",
    data,
  });
}

function sendRegisterCode(data: SendRegisterCodeRequest) {
  return request<SendRegisterCodeResponse>({
    url: "/api/auth/user/send-code",
    method: "POST",
    data,
  });
}

function sendPasswordResetCode(data: SendPasswordResetCodeRequest) {
  return request<SendPasswordResetCodeResponse>({
    url: "/api/auth/user/reset-password/send-code",
    method: "POST",
    data,
  });
}

function registerAccount(data: RegisterAccountRequest) {
  return request<RegisterAccountResponse>({
    url: "/api/auth/user/register",
    method: "POST",
    data,
  });
}

function resetPassword(data: ResetPasswordRequest) {
  return request<ResetPasswordResponse>({
    url: "/api/auth/user/reset-password",
    method: "POST",
    data,
  });
}

function loginWithEmail(data: LoginWithEmailRequest) {
  return request<LoginWithEmailResponse>({
    url: "/api/auth/user/sign-in",
    method: "POST",
    data,
  });
}

function logoutAccount() {
  return request<LogoutAccountResponse>({
    url: "/api/auth/user/logout",
    method: "POST",
  });
}

export const authApi = {
  getSliderChallenge,
  getSliderToken,
  sendRegisterCode,
  sendPasswordResetCode,
  registerAccount,
  resetPassword,
  loginWithEmail,
  logoutAccount,
};
