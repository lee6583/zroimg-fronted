import assert from "node:assert/strict";
import test from "node:test";
import { deleteBrowserResults } from "../src/utils/browser-results.ts";

test("deleting browser results removes unique IDs in one write transaction", async () => {
  const deletedIds: string[] = [];
  let closed = false;
  let transaction: IDBTransaction;

  const database = {
    close() {
      closed = true;
    },
    transaction(storeName: string, mode: IDBTransactionMode) {
      assert.equal(storeName, "results");
      assert.equal(mode, "readwrite");
      transaction = {
        error: null,
        objectStore(name: string) {
          assert.equal(name, "results");
          return {
            delete(id: string) {
              deletedIds.push(id);
            },
          } as unknown as IDBObjectStore;
        },
        onabort: null,
        oncomplete: null,
        onerror: null,
      } as unknown as IDBTransaction;
      queueMicrotask(() => transaction.oncomplete?.call(transaction, new Event("complete")));
      return transaction;
    },
  } as unknown as IDBDatabase;

  const openRequest = {
    result: database,
    onsuccess: null,
  } as unknown as IDBOpenDBRequest;
  const originalIndexedDB = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {
      open() {
        queueMicrotask(() => openRequest.onsuccess?.call(openRequest, new Event("success")));
        return openRequest;
      },
    } as unknown as IDBFactory,
  });

  try {
    await deleteBrowserResults(["result-1", "result-1", "", "result-2"]);
  } finally {
    if (originalIndexedDB) {
      Object.defineProperty(globalThis, "indexedDB", originalIndexedDB);
    } else {
      Reflect.deleteProperty(globalThis, "indexedDB");
    }
  }

  assert.deepEqual(deletedIds, ["result-1", "result-2"]);
  assert.equal(closed, true);
});

test("deleting an empty ID list does not open IndexedDB", async () => {
  const originalIndexedDB = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {
      open() {
        throw new Error("IndexedDB should not open for an empty ID list");
      },
    } as unknown as IDBFactory,
  });

  try {
    await deleteBrowserResults([]);
  } finally {
    if (originalIndexedDB) {
      Object.defineProperty(globalThis, "indexedDB", originalIndexedDB);
    } else {
      Reflect.deleteProperty(globalThis, "indexedDB");
    }
  }
});
