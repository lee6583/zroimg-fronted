import { request } from "@/utils/request";
import type {
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  RegisterAccountRequest,
  RegisterAccountResponse,
  SendRegisterCodeRequest,
  SendRegisterCodeResponse,
  SliderTokenRequest,
  SliderTokenResponse,
} from "@/types/auth";

function getSliderToken(data: SliderTokenRequest) {
  return request<SliderTokenResponse>({
    url: "/api/auth/slider-token",
    method: "POST",
    data,
  });
}

function sendRegisterCode(data: SendRegisterCodeRequest) {
  return request<SendRegisterCodeResponse>({
    url: "/api/auth/send-code",
    method: "POST",
    data,
  });
}

function registerAccount(data: RegisterAccountRequest) {
  return request<RegisterAccountResponse>({
    url: "/api/auth/register",
    method: "POST",
    data,
  });
}

function loginWithEmail(data: LoginWithEmailRequest) {
  return request<LoginWithEmailResponse>({
    url: "/api/auth/sign-in/email",
    method: "POST",
    data,
  });
}

export const authApi = {
  getSliderToken,
  sendRegisterCode,
  registerAccount,
  loginWithEmail,
};
