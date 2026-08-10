import "server-only";

import { isJavaBffEnabled } from "@/server/env";
import * as mockFavorites from "@/server/bff/internal/favorites";
import * as javaFavorites from "@/server/bff/internal/java-favorites";
import * as mockFeedback from "@/server/bff/internal/feedback";
import * as javaFeedback from "@/server/bff/internal/java-feedback";
import * as mockDashboard from "@/server/bff/internal/dashboard";
import * as javaDashboard from "@/server/bff/internal/java-dashboard";
import * as mockCheckins from "@/server/bff/internal/checkins";
import * as javaCheckins from "@/server/bff/internal/java-checkins";

export { claimDailyCheckIn, getCheckInDateInfo } from "@/server/bff/internal/checkins";

export async function getCheckInStatus(profileId: string) {
  if (isJavaBffEnabled()) {
    return javaCheckins.getJavaCheckInStatus();
  }

  return mockCheckins.getCheckInStatus(profileId);
}

export async function getDashboardStats(profileId: string) {
  if (isJavaBffEnabled()) {
    return javaDashboard.getDashboardStats();
  }

  return mockDashboard.getDashboardStats(profileId);
}
export {
  getCheckInSettings,
  getAnnouncementSettings,
  getEasyPayAdminConfig,
  getPublicAnnouncement,
  getSmtpAdminConfig,
  getVideoConfig,
  updateCheckInSettings,
  updateAnnouncementSettings,
  updateEasyPaySettings,
  updateSmtpSettings,
  updateVideoConfig,
} from "@/server/bff/internal/settings";

export async function addImageToCollection(
  profileId: string,
  collectionId: string,
  imageId: string,
) {
  if (isJavaBffEnabled()) {
    return javaFavorites.addImage(collectionId, imageId);
  }

  return mockFavorites.addImage(profileId, collectionId, imageId);
}

export async function removeImageFromCollection(
  profileId: string,
  collectionId: string,
  imageId: string,
) {
  if (isJavaBffEnabled()) {
    return javaFavorites.removeImage(collectionId, imageId);
  }

  return mockFavorites.removeImage(profileId, collectionId, imageId);
}

export async function createCollection(profileId: string, name: string) {
  if (isJavaBffEnabled()) {
    return javaFavorites.createCollection(name);
  }

  return mockFavorites.createCollection(profileId, name);
}

export async function deleteCollection(profileId: string, collectionId: string) {
  if (isJavaBffEnabled()) {
    return javaFavorites.deleteCollection(collectionId);
  }

  return mockFavorites.deleteCollection(profileId, collectionId);
}

export async function getCollection(profileId: string, collectionId: string) {
  if (isJavaBffEnabled()) {
    return javaFavorites.getCollection(collectionId);
  }

  return mockFavorites.getCollection(profileId, collectionId);
}

export async function listCollections(profileId: string) {
  if (isJavaBffEnabled()) {
    return javaFavorites.listCollections();
  }

  return mockFavorites.listCollections(profileId);
}

export async function updateCollectionName(profileId: string, collectionId: string, name: string) {
  if (isJavaBffEnabled()) {
    return javaFavorites.updateName(collectionId, name);
  }

  return mockFavorites.updateName(profileId, collectionId, name);
}

export async function addTicketMessage(input: Parameters<typeof mockFeedback.addMessage>[0]) {
  if (isJavaBffEnabled()) {
    return javaFeedback.addMessage(input);
  }

  return mockFeedback.addMessage(input);
}

export async function createTicket(input: Parameters<typeof mockFeedback.createTicket>[0]) {
  if (isJavaBffEnabled()) {
    return javaFeedback.createTicket(input);
  }

  return mockFeedback.createTicket(input);
}

export async function getAdminTicket(ticketId: string) {
  if (isJavaBffEnabled()) {
    return javaFeedback.getForAdmin(ticketId);
  }

  return mockFeedback.getForAdmin(ticketId);
}

export async function listAdminTickets(input: Parameters<typeof mockFeedback.listForAdmin>[0]) {
  if (isJavaBffEnabled()) {
    return javaFeedback.listForAdmin(input);
  }

  return mockFeedback.listForAdmin(input);
}

export async function listTicketsForUser(profileId: string) {
  if (isJavaBffEnabled()) {
    return javaFeedback.listForUser(profileId);
  }

  return mockFeedback.listForUser(profileId);
}

export async function listTicketsForUserPage(
  input: Parameters<typeof mockFeedback.listForUserPage>[0],
) {
  if (isJavaBffEnabled()) {
    return javaFeedback.listForUserPage(input);
  }

  return mockFeedback.listForUserPage(input);
}

export async function updateTicketStatus(
  ticketId: string,
  status: Parameters<typeof mockFeedback.updateStatus>[1],
) {
  if (isJavaBffEnabled()) {
    return javaFeedback.updateStatus(ticketId, status);
  }

  return mockFeedback.updateStatus(ticketId, status);
}

export type { CheckInDateInfo, CheckInStatus } from "@/types/checkin";
export type { CheckInSettingsConfig, EasyPayAdminConfig, SmtpAdminConfig } from "@/types/admin";
