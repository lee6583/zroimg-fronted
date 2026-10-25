import type { CurrentUser } from "@/types/auth";

// Java UpdateProfileDTO（PUT /auth/user/profile）
type UpdateAccountProfileRequest = {
  username: string;
  bio: string;
};

type UpdateAccountProfileResponse = CurrentUser;

// Java ChangePasswordDTO（PUT /auth/user/password）
type UpdateAccountPasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type UpdateAccountPasswordResponse = null;

// Java MediaAssetVO（POST /media/user/assets、/media/user/assets/avatar）
type MediaAsset = {
  id: string;
  originalName: string | null;
  mediaType: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  status: string;
  contentUrl: string;
  createdAt: string;
};

type UpdateAccountAvatarRequest = FormData;

type UpdateAccountAvatarResponse = MediaAsset;

export type {
  UpdateAccountProfileRequest,
  UpdateAccountProfileResponse,
  UpdateAccountPasswordRequest,
  UpdateAccountPasswordResponse,
  MediaAsset,
  UpdateAccountAvatarRequest,
  UpdateAccountAvatarResponse,
};
