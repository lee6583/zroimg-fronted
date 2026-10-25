import { request } from "@/utils/request";
import type {
  UpdateAccountPasswordRequest,
  UpdateAccountPasswordResponse,
  UpdateAccountAvatarRequest,
  UpdateAccountAvatarResponse,
  UpdateAccountProfileRequest,
  UpdateAccountProfileResponse,
} from "@/types/account";

function updateProfile(data: UpdateAccountProfileRequest) {
  return request<UpdateAccountProfileResponse>({
    url: "/api/auth/user/profile",
    method: "PUT",
    data,
  });
}

function updatePassword(data: UpdateAccountPasswordRequest) {
  return request<UpdateAccountPasswordResponse>({
    url: "/api/auth/user/password",
    method: "PUT",
    data,
  });
}

function updateAvatar(data: UpdateAccountAvatarRequest) {
  return request<UpdateAccountAvatarResponse>({
    url: "/api/media/user/assets/avatar",
    method: "POST",
    body: data,
  });
}

export const accountApi = {
  updateProfile,
  updatePassword,
  updateAvatar,
};
