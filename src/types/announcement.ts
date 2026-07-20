type AnnouncementSettingsConfig = {
  enabled: boolean;
  title: string;
  content: string;
  updatedAt: string;
};

type PublicAnnouncement = AnnouncementSettingsConfig;

type SaveAnnouncementSettingsRequest = {
  enabled: boolean;
  title: string;
  content: string;
};

type SaveAnnouncementSettingsResponse = {
  settings: AnnouncementSettingsConfig;
};

export type {
  AnnouncementSettingsConfig,
  PublicAnnouncement,
  SaveAnnouncementSettingsRequest,
  SaveAnnouncementSettingsResponse,
};
