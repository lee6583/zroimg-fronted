import { request } from "@/utils/request";
import type {
  AnnouncementSettingsConfig,
  CheckInSettingsConfig,
  DocsConfig,
  EasyPayAdminConfig,
  SaveAnnouncementSettingsRequest,
  SaveCheckInSettingsRequest,
  SaveEasyPaySettingsRequest,
  SaveSmtpSettingsRequest,
  SmtpAdminConfig,
  TestSmtpSettingsRequest,
} from "@/types/admin";

function saveSmtp(data: SaveSmtpSettingsRequest) {
  return request<SmtpAdminConfig>({
    url: "/api/admin/settings/smtp",
    method: "POST",
    data,
  });
}

function testSmtp(data: TestSmtpSettingsRequest) {
  return request<null>({
    url: "/api/admin/settings/smtp/test",
    method: "POST",
    data,
  });
}

function saveEasyPay(data: SaveEasyPaySettingsRequest) {
  return request<EasyPayAdminConfig>({
    url: "/api/admin/settings/easypay",
    method: "POST",
    data,
  });
}

function saveCheckIn(data: SaveCheckInSettingsRequest) {
  return request<CheckInSettingsConfig>({
    url: "/api/admin/settings/checkin",
    method: "POST",
    data,
  });
}

function saveAnnouncement(data: SaveAnnouncementSettingsRequest) {
  return request<AnnouncementSettingsConfig>({
    url: "/api/admin/settings/announcement",
    method: "POST",
    data,
  });
}

function saveDocs(data: DocsConfig) {
  return request<DocsConfig>({
    url: "/api/admin/settings/docs",
    method: "POST",
    data,
  });
}

export const adminSettingsApi = {
  saveSmtp,
  testSmtp,
  saveEasyPay,
  saveCheckIn,
  saveAnnouncement,
  saveDocs,
};
