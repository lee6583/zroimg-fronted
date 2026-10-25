// Java LoginUserVO.UserInfoVO
type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
};

// Java CurrentUserVO（GET /auth/user/me）
type CurrentUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  bio: string | null;
  avatarUrl: string | null;
  status: number;
  totalPoints: number;
  createdAt: string;
};

// Java SliderChallengeDTO / SliderChallengeVO
type SliderChallengeRequest = {
  email: string;
  scene: "register";
};

type SliderChallengeResponse = {
  challengeId: string;
  targetRatio: number;
};

// Java SliderTokenDTO / SliderTokenVO
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

// Java SendCodeVO
type SendCodeResponse = {
  cooldownSeconds: number;
  expiresInSeconds: number;
};

type SendRegisterCodeRequest = {
  email: string;
  sliderToken: string;
};

type SendRegisterCodeResponse = SendCodeResponse;

type SendPasswordResetCodeRequest = {
  email: string;
};

type SendPasswordResetCodeResponse = SendCodeResponse;

// Java RegisterDTO
type RegisterAccountRequest = {
  username: string;
  email: string;
  password: string;
  code: string;
};

type RegisterAccountResponse = null;

// Java LoginDTO / LoginUserVO
type LoginWithEmailRequest = {
  email: string;
  password: string;
};

type LoginWithEmailResponse = {
  user: AuthUser;
};

// Java ResetPasswordDTO
type ResetPasswordRequest = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

type ResetPasswordResponse = Record<string, never>;

type LogoutAccountResponse = null;

export type {
  AuthUser,
  CurrentUser,
  SliderChallengeRequest,
  SliderChallengeResponse,
  SliderTokenRequest,
  SliderTokenResponse,
  SendCodeResponse,
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
