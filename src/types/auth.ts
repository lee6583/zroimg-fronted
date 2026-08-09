type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
};

type SliderChallengeRequest = {
  email: string;
  scene: "register";
};

type SliderChallengeResponse = {
  challengeId: string;
  targetRatio: number;
};

type SliderTokenRequest = {
  email: string;
  scene: "register";
  challengeId: string;
  positionRatio: number;
  durationMs: number;
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

type LogoutAccountResponse = {
  message: string;
};

export type {
  AuthUser,
  SliderChallengeRequest,
  SliderChallengeResponse,
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
