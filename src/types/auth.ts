import type { OkResponse } from "@/types/api";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type SliderTokenRequest = {
  email: string;
  scene?: string;
};

type SliderTokenResponse = {
  sliderToken: string;
};

type SendRegisterCodeRequest = {
  email: string;
  sliderToken: string;
};

type SendRegisterCodeResponse = {
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

type SendPasswordResetCodeRequest = {
  email: string;
};

type SendPasswordResetCodeResponse = {
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

type RegisterAccountRequest = {
  username: string;
  email: string;
  password: string;
  code: string;
};

type RegisterAccountResponse = {
  message: string;
};

type LoginWithEmailRequest = {
  email: string;
  password: string;
};

type LoginWithEmailResponse = {
  message: string;
  user: AuthUser;
};

type ResetPasswordRequest = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

type ResetPasswordResponse = {
  message: string;
};

type LogoutAccountResponse = OkResponse;

export type {
  AuthUser,
  SliderTokenRequest,
  SliderTokenResponse,
  SendRegisterCodeRequest,
  SendRegisterCodeResponse,
  SendPasswordResetCodeRequest,
  SendPasswordResetCodeResponse,
  RegisterAccountRequest,
  RegisterAccountResponse,
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  LogoutAccountResponse,
};
