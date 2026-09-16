import { request } from "@/utils/request";
import type {
  SaveAnnouncementSettingsRequest,
  SaveAnnouncementSettingsResponse,
} from "@/types/announcement";
import type {
  SaveCheckInSettingsRequest,
  SaveCheckInSettingsResponse,
  SaveEasyPaySettingsRequest,
  SaveEasyPaySettingsResponse,
  SaveVideoSettingsRequest,
  SaveVideoSettingsResponse,
  SaveSmtpSettingsRequest,
  SaveSmtpSettingsResponse,
  TestSmtpSettingsRequest,
  TestSmtpSettingsResponse,
} from "@/types/admin";

function saveSmtpSettings(data: SaveSmtpSettingsRequest) {
  return request<SaveSmtpSettingsResponse>({
    url: "/api/admin/settings/mail",
    method: "POST",
    data,
  });
}

function saveVideoSettings(data: SaveVideoSettingsRequest) {
  return request<SaveVideoSettingsResponse>({
    url: "/api/admin/settings/video",
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

function saveAnnouncementSettings(data: SaveAnnouncementSettingsRequest) {
  return request<SaveAnnouncementSettingsResponse>({
    url: "/api/admin/settings/announcement",
    method: "POST",
    data,
  });
}

export const adminSettingsApi = {
  saveSmtpSettings,
  saveVideoSettings,
  testSmtpSettings,
  saveEasyPaySettings,
  saveCheckInSettings,
  saveAnnouncementSettings,
};
