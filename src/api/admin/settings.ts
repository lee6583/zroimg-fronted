import { request } from "@/utils/request";
import type {
  AnnouncementSettingsConfig,
  CanvasSettingsConfig,
  CheckInSettingsConfig,
  RegistrationSettingsConfig,
  DocsConfig,
  EasyPayAdminConfig,
  GenerationSettingsConfig,
  SaveAnnouncementSettingsRequest,
  SaveCanvasSettingsRequest,
  SaveCheckInSettingsRequest,
  SaveRegistrationSettingsRequest,
  SaveEasyPaySettingsRequest,
  SaveGenerationSettingsRequest,
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

function saveRegistration(data: SaveRegistrationSettingsRequest) {
  return request<RegistrationSettingsConfig>({
    url: "/api/admin/settings/registration",
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

function saveCanvas(data: SaveCanvasSettingsRequest) {
  return request<CanvasSettingsConfig>({
    url: "/api/admin/settings/canvas",
    method: "POST",
    data,
  });
}

function saveGeneration(data: SaveGenerationSettingsRequest) {
  return request<GenerationSettingsConfig>({
    url: "/api/admin/settings/generation",
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
  saveRegistration,
  saveAnnouncement,
  saveCanvas,
  saveGeneration,
  saveDocs,
};
