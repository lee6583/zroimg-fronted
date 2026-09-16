import type { OkResponse } from "@/types/api";

type UpdateAccountProfileRequest = FormData;

type UpdateAccountPasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UpdateAccountAvatarRequest = FormData;

type UpdateAccountAvatarResponse = {
  avatarUrl: string;
};

type UpdateAccountProfileResponse = OkResponse;

type UpdateAccountPasswordResponse = OkResponse;

export type {
  UpdateAccountProfileRequest,
  UpdateAccountPasswordRequest,
  UpdateAccountAvatarRequest,
  UpdateAccountAvatarResponse,
  UpdateAccountProfileResponse,
  UpdateAccountPasswordResponse,
};
