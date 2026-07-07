export type LocalGenerationProviderConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  updatedAt: string | null;
};

export type LocalGenerationInput = {
  id: string;
  provider: LocalGenerationProviderConfig;
  prompt: string;
  mode: "text" | "edit";
  model: string;
  size: string;
  quality: "low" | "medium" | "high";
  outputFormat: "png" | "webp" | "jpeg";
  imageCount: number;
  inputFiles: File[];
};

export type LocalGenerationTaskRecord = {
  id: string;
  prompt: string;
  mode: "text" | "edit";
  model: string;
  size: string;
  quality: string;
  outputFormat: string;
  imageCount: number;
  imageUrls: string[];
  createdAt: string;
};

const providerStorageKey = "zrocode.localGenerationProvider";
const dbName = "zrocode-local-generation";
const dbVersion = 1;
const taskStoreName = "tasks";

const defaultProviderConfig: LocalGenerationProviderConfig = {
  enabled: false,
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  updatedAt: null,
};

function normalizeBaseUrl(baseUrl: string) {
  const normalized = baseUrl.trim() || defaultProviderConfig.baseUrl;
  return normalized.replace(/\/+$/, "");
}

function outputContentType(format: string) {
  if (format === "webp") return "image/webp";
  if (format === "jpeg") return "image/jpeg";
  return "image/png";
}

function endpoint(baseUrl: string, path: "generations" | "edits") {
  return `${normalizeBaseUrl(baseUrl)}/images/${path}`;
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
}

async function remoteImageToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("图片下载失败，无法保存到本地浏览器");
  return blobToDataUrl(await response.blob());
}

function parseImageUrls(data: unknown, format: string) {
  const response = data as { data?: Array<{ b64_json?: string; url?: string }> };
  const contentType = outputContentType(format);
  return (response.data ?? []).map((item) => {
    if (item.b64_json) return `data:${contentType};base64,${item.b64_json}`;
    return item.url ?? "";
  }).filter(Boolean);
}

function openLocalGenerationDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(taskStoreName)) {
        const store = db.createObjectStore(taskStoreName, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("无法打开本地图片数据库"));
  });
}

export function getLocalGenerationProvider() {
  if (typeof window === "undefined") return defaultProviderConfig;

  const raw = window.localStorage.getItem(providerStorageKey);
  if (!raw) return defaultProviderConfig;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalGenerationProviderConfig>;
    return {
      enabled: Boolean(parsed.enabled),
      baseUrl: parsed.baseUrl || defaultProviderConfig.baseUrl,
      apiKey: parsed.apiKey || "",
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return defaultProviderConfig;
  }
}

export function saveLocalGenerationProvider(config: LocalGenerationProviderConfig) {
  window.localStorage.setItem(
    providerStorageKey,
    JSON.stringify({
      ...config,
      baseUrl: normalizeBaseUrl(config.baseUrl),
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearLocalGenerationProvider() {
  window.localStorage.removeItem(providerStorageKey);
}

export function hasUsableLocalGenerationProvider(config: LocalGenerationProviderConfig) {
  return config.enabled && Boolean(config.apiKey.trim());
}

export async function runLocalImageGeneration(input: LocalGenerationInput) {
  const headers = {
    Authorization: `Bearer ${input.provider.apiKey.trim()}`,
  };

  const commonFields = {
    model: input.model,
    prompt: input.prompt,
    n: input.imageCount,
    size: input.size,
    quality: input.quality,
    output_format: input.outputFormat,
    background: "auto",
  };

  const response =
    input.mode === "edit"
      ? await runLocalEdit(input, headers, commonFields)
      : await fetch(endpoint(input.provider.baseUrl, "generations"), {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commonFields),
        });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || data?.error || "本地自定义接口生成失败";
    throw new Error(message);
  }

  const rawImageUrls = parseImageUrls(data, input.outputFormat);
  const imageUrls = await Promise.all(
    rawImageUrls.map((url) => (url.startsWith("data:") ? url : remoteImageToDataUrl(url))),
  );

  if (imageUrls.length === 0) {
    throw new Error("本地自定义接口没有返回图片");
  }

  return imageUrls;
}

async function runLocalEdit(
  input: LocalGenerationInput,
  headers: { Authorization: string },
  fields: Record<string, string | number>,
) {
  if (input.inputFiles.length === 0) {
    throw new Error("图生图需要上传本地参考图");
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, String(value));
  }
  for (const file of input.inputFiles) {
    form.append("image", file, file.name || "input.png");
  }

  return fetch(endpoint(input.provider.baseUrl, "edits"), {
    method: "POST",
    headers,
    body: form,
  });
}

export async function saveLocalGenerationTask(record: LocalGenerationTaskRecord) {
  const db = await openLocalGenerationDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(taskStoreName, "readwrite");
    transaction.objectStore(taskStoreName).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("本地图片保存失败"));
  });

  db.close();
}

export async function listLocalGenerationTasks(limit = 3) {
  const db = await openLocalGenerationDb();

  const tasks = await new Promise<LocalGenerationTaskRecord[]>((resolve, reject) => {
    const records: LocalGenerationTaskRecord[] = [];
    const transaction = db.transaction(taskStoreName, "readonly");
    const index = transaction.objectStore(taskStoreName).index("createdAt");
    const request = index.openCursor(null, "prev");

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || records.length >= limit) {
        resolve(records);
        return;
      }

      records.push(cursor.value as LocalGenerationTaskRecord);
      cursor.continue();
    };

    request.onerror = () => reject(new Error("本地图片读取失败"));
  });

  db.close();
  return tasks;
}
