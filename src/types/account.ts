import type { OkResponse } from "@/types/api";

type UpdateAccountProfileRequest = FormData;

type UpdateAccountPasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UpdateAccountProfileResponse = OkResponse;

type UpdateAccountPasswordResponse = OkResponse;

export type {
  UpdateAccountProfileRequest,
  UpdateAccountPasswordRequest,
  UpdateAccountProfileResponse,
  UpdateAccountPasswordResponse,
};
