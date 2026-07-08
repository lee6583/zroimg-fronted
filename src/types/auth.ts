import type { OkResponse } from "@/types/api";

export type SliderTokenRequest = {
  email: string;
  scene?: string;
};

export type SliderTokenResponse = {
  token?: string;
  sliderToken?: string;
};

export type SendRegisterCodeRequest = {
  email: string;
  sliderToken: string;
};

export type SendRegisterCodeResponse = {
  message?: string;
  code?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
};

export type RegisterAccountRequest = {
  username: string;
  email: string;
  password: string;
  code: string;
};

export type RegisterAccountResponse = OkResponse;

export type LoginWithEmailRequest = {
  email: string;
  password: string;
};

export type LoginWithEmailResponse = OkResponse;
