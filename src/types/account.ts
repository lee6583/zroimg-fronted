import type { OkResponse } from "@/types/api";

export type UpdateAccountProfileRequest = FormData;

export type UpdateAccountPasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type UpdateAccountProfileResponse = OkResponse;

export type UpdateAccountPasswordResponse = OkResponse;
