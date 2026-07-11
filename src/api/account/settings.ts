import { request } from "@/utils/request";
import type {
  UpdateAccountPasswordRequest,
  UpdateAccountPasswordResponse,
  UpdateAccountProfileRequest,
  UpdateAccountProfileResponse,
} from "@/types/account";

function updateProfile(data: UpdateAccountProfileRequest) {
  return request<UpdateAccountProfileResponse>({
    url: "/api/account/profile",
    method: "POST",
    body: data,
  });
}

function updatePassword(data: UpdateAccountPasswordRequest) {
  return request<UpdateAccountPasswordResponse>({
    url: "/api/account/password",
    method: "POST",
    data,
  });
}

export const accountApi = {
  updateProfile,
  updatePassword,
};
