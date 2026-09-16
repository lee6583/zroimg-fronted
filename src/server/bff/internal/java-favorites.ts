import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import type {
  MockFavoriteCollection,
  MockFavoriteCollectionItem,
  MockGeneratedImage,
  MockGenerationTask,
  MockMediaAsset,
} from "@/server/bff/mock-store";

const javaAssetSchema = z.object({
  id: javaIdSchema,
  fileName: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

const javaImageSchema = z.object({
  id: javaIdSchema,
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  outputAsset: javaAssetSchema,
  thumbnailAsset: javaAssetSchema.nullable().optional(),
  task: z.object({ prompt: z.string() }),
});

const javaItemSchema = z.object({
  id: javaIdSchema,
  createdAt: z.string(),
  generatedImage: javaImageSchema,
});

const javaCollectionSchema = z.object({
  id: javaIdSchema,
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  count: z.object({ items: z.number() }),
  items: z.array(javaItemSchema).optional(),
});

function toAsset(asset: z.infer<typeof javaAssetSchema>): MockMediaAsset {
  return {
    id: String(asset.id),
    ownerUserProfileId: null,
    fileName: asset.fileName ?? null,
    kind: "output",
    width: asset.width ?? null,
    height: asset.height ?? null,
    url: `/api/media/assets/${asset.id}`,
    createdAt: new Date(0),
  };
}

function toTask(prompt: string, createdAt: Date, imageId: string): MockGenerationTask {
  return {
    id: `java-task-${imageId}`,
    userProfileId: "",
    conversationId: "",
    prompt,
    mode: "text",
    status: "succeeded",
    model: "gpt-image-2",
    size: "1024x1024",
    quality: "medium",
    outputFormat: "png",
    imageCount: 1,
    costCredits: 0,
    error: null,
    createdAt,
    updatedAt: createdAt,
  };
}

type CollectionWithItems = MockFavoriteCollection & {
  _count: { items: number };
  items: Array<
    MockFavoriteCollectionItem & {
      generatedImage: MockGeneratedImage & {
        outputAsset: MockMediaAsset;
        thumbnailAsset: MockMediaAsset | null;
        task: MockGenerationTask;
      };
    }
  >;
};

function toCollection(input: z.infer<typeof javaCollectionSchema>): CollectionWithItems {
  const collection: CollectionWithItems = {
    id: String(input.id),
    userProfileId: "",
    name: input.name,
    createdAt: new Date(input.createdAt),
    updatedAt: new Date(input.updatedAt),
    _count: { items: input.count.items },
    items: [],
  };

  if (input.items) {
    collection.items = input.items.map((item) => {
      const imageId = String(item.generatedImage.id);
      const createdAt = new Date(item.createdAt);
      const outputAsset = toAsset(item.generatedImage.outputAsset);
      const thumbnailAsset = item.generatedImage.thumbnailAsset
        ? toAsset(item.generatedImage.thumbnailAsset)
        : null;
      const generatedImage: MockGeneratedImage & {
        outputAsset: MockMediaAsset;
        thumbnailAsset: MockMediaAsset | null;
        task: MockGenerationTask;
      } = {
        id: imageId,
        userProfileId: "",
        taskId: `java-task-${imageId}`,
        outputAssetId: outputAsset.id,
        thumbnailAssetId: thumbnailAsset?.id ?? null,
        width: item.generatedImage.width ?? null,
        height: item.generatedImage.height ?? null,
        createdAt,
        outputAsset,
        thumbnailAsset,
        task: toTask(item.generatedImage.task.prompt, createdAt, imageId),
      };

      return {
        id: String(item.id),
        collectionId: String(input.id),
        generatedImageId: imageId,
        createdAt,
        generatedImage,
      };
    });
  }

  return collection;
}

export async function listCollections() {
  const payload = await requestJavaApiData<unknown>("/favorite/user/collections");
  return z.array(javaCollectionSchema).parse(payload).map(toCollection);
}

export async function createCollection(name: string) {
  const payload = await requestJavaApiData<unknown>("/favorite/user/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return toCollection(javaCollectionSchema.parse(payload));
}

export async function updateName(collectionId: string, name: string) {
  const payload = await requestJavaApiData<unknown>(
    `/favorite/user/collections/${encodeURIComponent(collectionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
  );
  return toCollection(javaCollectionSchema.parse(payload));
}

export async function deleteCollection(collectionId: string) {
  await requestJavaApiData<unknown>(
    `/favorite/user/collections/${encodeURIComponent(collectionId)}`,
    { method: "DELETE" },
  );
}

export async function addImage(collectionId: string, imageId: string) {
  await requestJavaApiData<unknown>(
    `/favorite/user/collections/${encodeURIComponent(collectionId)}/images`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedImageId: imageId }),
    },
  );
}

export async function removeImage(collectionId: string, imageId: string) {
  await requestJavaApiData<unknown>(
    `/favorite/user/collections/${encodeURIComponent(collectionId)}/images`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedImageId: imageId }),
    },
  );
}

export async function getCollection(collectionId: string) {
  const payload = await requestJavaApiData<unknown>(
    `/favorite/user/collections/${encodeURIComponent(collectionId)}`,
  );
  return toCollection(javaCollectionSchema.parse(payload));
}
