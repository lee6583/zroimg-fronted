import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import type {
  MockGeneratedImage,
  MockGalleryImage,
  MockMediaAsset,
  MockUser,
  MockUserProfile,
} from "@/server/bff/mock-store";

const javaAssetSchema = z.object({
  id: z.number(),
  fileName: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

const javaGallerySchema = z.object({
  id: z.number(),
  generatedImageId: z.number(),
  userId: z.number(),
  prompt: z.string(),
  title: z.string().nullable().optional(),
  category: z.string(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  generatedImage: z.object({
    id: z.number(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    outputAsset: javaAssetSchema,
    thumbnailAsset: javaAssetSchema.nullable().optional(),
  }),
  userProfile: z.object({
    username: z.string(),
    user: z.object({ name: z.string() }),
  }),
});

const javaGalleryPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaGallerySchema),
});

function toAsset(input: z.infer<typeof javaAssetSchema>): MockMediaAsset {
  return {
    id: String(input.id),
    ownerUserProfileId: null,
    fileName: input.fileName ?? null,
    kind: "output",
    width: input.width ?? null,
    height: input.height ?? null,
    url: `/api/media/public-assets/${input.id}`,
    createdAt: new Date(0),
  };
}

function toGallery(input: z.infer<typeof javaGallerySchema>): MockGalleryImage & {
  generatedImage: MockGeneratedImage & {
    outputAsset: MockMediaAsset;
    thumbnailAsset: MockMediaAsset | null;
  };
  userProfile: MockUserProfile & { user: MockUser };
} {
  const outputAsset = toAsset(input.generatedImage.outputAsset);
  const thumbnailAsset = input.generatedImage.thumbnailAsset
    ? toAsset(input.generatedImage.thumbnailAsset)
    : null;
  const createdAt = new Date(input.createdAt);

  return {
    id: String(input.id),
    generatedImageId: String(input.generatedImageId),
    userProfileId: String(input.userId),
    prompt: input.prompt,
    title: input.title ?? null,
    category: input.category as MockGalleryImage["category"],
    isPublic: input.isPublic,
    createdAt,
    generatedImage: {
      id: String(input.generatedImage.id),
      userProfileId: String(input.userId),
      taskId: "",
      outputAssetId: outputAsset.id,
      thumbnailAssetId: thumbnailAsset?.id ?? null,
      width: input.generatedImage.width ?? null,
      height: input.generatedImage.height ?? null,
      createdAt,
      outputAsset,
      thumbnailAsset,
    },
    userProfile: {
      id: String(input.userId),
      userId: String(input.userId),
      username: input.userProfile.username,
      role: "user",
      status: "active",
      creditBalance: 0,
      bio: "",
      createdAt,
      user: {
        id: String(input.userId),
        email: "",
        password: "",
        name: input.userProfile.user.name,
        createdAt,
      },
    },
  };
}

type GalleryQuery = {
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function listPublicImages(input: GalleryQuery = {}) {
  const params = new URLSearchParams({
    pageNo: String(input.page || 1),
    pageSize: String(input.pageSize || 20),
  });
  if (input.category) {
    params.set("category", input.category);
  }

  const path = `/gallery/public/images?${params.toString()}`;
  const payload = await requestJavaApiData<unknown>(path);
  const page = javaGalleryPageSchema.parse(payload);

  return {
    total: page.total,
    pages: page.pages,
    list: page.list.map(toGallery),
  };
}

export async function publishImage(imageId: string) {
  const payload = await requestJavaApiData<unknown>("/gallery/user/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generatedImageId: Number(imageId) }),
  });
  return toGallery(javaGallerySchema.parse(payload));
}

export async function unpublishImage(imageId: string) {
  await requestJavaApiData<unknown>(`/gallery/user/publish/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
  });
}

export async function getMediaUrl(assetId: string, isPublic = false) {
  const route = isPublic ? "public-assets" : "assets";
  return `/api/media/${route}/${encodeURIComponent(assetId)}`;
}
