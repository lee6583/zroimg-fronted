import { request } from "@/utils/request";
import type {
  SaveCheckInSettingsRequest,
  SaveCheckInSettingsResponse,
  SaveEasyPaySettingsRequest,
  SaveEasyPaySettingsResponse,
  SaveGenerationSettingsRequest,
  SaveGenerationSettingsResponse,
  SaveSmtpSettingsRequest,
  SaveSmtpSettingsResponse,
  TestSmtpSettingsRequest,
  TestSmtpSettingsResponse,
} from "@/types/admin";

function saveGenerationSettings(data: SaveGenerationSettingsRequest) {
  return request<SaveGenerationSettingsResponse>({
    url: "/api/admin/settings/generation",
    method: "POST",
    data,
  });
}

function saveSmtpSettings(data: SaveSmtpSettingsRequest) {
  return request<SaveSmtpSettingsResponse>({
    url: "/api/admin/settings/mail",
    method: "POST",
    data,
  });
}

function testSmtpSettings(data: TestSmtpSettingsRequest) {
  return request<TestSmtpSettingsResponse>({
    url: "/api/admin/settings/mail/test",
    method: "POST",
    data,
  });
}

function saveEasyPaySettings(data: SaveEasyPaySettingsRequest) {
  return request<SaveEasyPaySettingsResponse>({
    url: "/api/admin/settings/payment/easypay",
    method: "POST",
    data,
  });
}

function saveCheckInSettings(data: SaveCheckInSettingsRequest) {
  return request<SaveCheckInSettingsResponse>({
    url: "/api/admin/settings/checkin",
    method: "POST",
    data,
  });
}

export const adminSettingsApi = {
  saveGenerationSettings,
  saveSmtpSettings,
  testSmtpSettings,
  saveEasyPaySettings,
  saveCheckInSettings,
};
