import type { OkResponse } from "@/types/api";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export type SliderTokenRequest = {
  email: string;
  scene?: string;
};

export type SliderTokenResponse = {
  sliderToken: string;
};

export type SendRegisterCodeRequest = {
  email: string;
  sliderToken: string;
};

export type SendRegisterCodeResponse = {
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

export type RegisterAccountRequest = {
  username: string;
  email: string;
  password: string;
  code: string;
};

export type RegisterAccountResponse = {
  message: string;
};

export type LoginWithEmailRequest = {
  email: string;
  password: string;
};

export type LoginWithEmailResponse = {
  message: string;
  user: AuthUser;
};

export type LogoutAccountResponse = OkResponse;
