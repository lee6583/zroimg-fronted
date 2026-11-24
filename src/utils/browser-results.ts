const databaseName = "zroimg-browser-results";
const storeName = "results";

export type BrowserResultMetadata = {
  id: string;
  url: string;
  fileName: string;
};

type StoredResult = {
  id: string;
  blob: Blob;
  fileName: string;
  savedAt: number;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readBrowserResult(id: string) {
  const database = await openDatabase();
  try {
    return await new Promise<StoredResult | null>((resolve, reject) => {
      const request = database.transaction(storeName).objectStore(storeName).get(id);
      request.onsuccess = () => resolve((request.result as StoredResult | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveBrowserResult(metadata: BrowserResultMetadata) {
  const database = await openDatabase();
  try {
    const exists = await new Promise<boolean>((resolve, reject) => {
      const request = database.transaction(storeName).objectStore(storeName).count(metadata.id);
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(request.error);
    });
    if (exists) return;

    const response = await fetch(metadata.url, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Unable to retrieve generated result (${response.status})`);
    const blob = await response.blob();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put({
        id: metadata.id,
        blob,
        fileName: metadata.fileName,
        savedAt: Date.now(),
      } satisfies StoredResult);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function downloadBrowserResult(metadata: BrowserResultMetadata) {
  await saveBrowserResult(metadata);
  const stored = await readBrowserResult(metadata.id);
  if (!stored) throw new Error("Browser result is unavailable");
  const objectUrl = URL.createObjectURL(stored.blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = metadata.fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
