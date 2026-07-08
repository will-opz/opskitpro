import { useState, useEffect, useCallback } from "react";

export type StoredDiagnosticTarget = {
  target: string;
  lastCheckedAt: string;
  pinned?: boolean;
};

type StoredDiagnosticResult = {
  target: string;
  savedAt: number;
  result: any;
};

const historyStoreName = "diagnostic-targets";
const resultStoreName = "diagnostic-results";
const historyDbName = "opskitpro-diagnostics";
const historyDbVersion = 2;

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(historyDbName, historyDbVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(historyStoreName)) {
        db.createObjectStore(historyStoreName, { keyPath: "target" });
      }
      if (!db.objectStoreNames.contains(resultStoreName)) {
        db.createObjectStore(resultStoreName, { keyPath: "target" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readHistory(): Promise<StoredDiagnosticTarget[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openHistoryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(historyStoreName, "readonly");
    const request = tx.objectStore(historyStoreName).getAll();
    request.onsuccess = () => {
      resolve(
        (request.result as StoredDiagnosticTarget[])
          .sort(
            (a, b) =>
              Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
              String(b.lastCheckedAt).localeCompare(a.lastCheckedAt),
          )
          .slice(0, 20),
      );
    };
    request.onerror = () => reject(request.error);
  });
}

async function upsertHistoryRecord(item: StoredDiagnosticTarget) {
  if (typeof indexedDB === "undefined") return;
  const existing = await readHistory();
  const previous = existing.find((entry) => entry.target === item.target);
  const db = await openHistoryDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(historyStoreName, "readwrite");
    tx.objectStore(historyStoreName).put({ ...previous, ...item });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteHistoryTargetRecord(target: string) {
  if (typeof indexedDB === "undefined") return;
  const db = await openHistoryDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(historyStoreName, "readwrite");
    tx.objectStore(historyStoreName).delete(target);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function readCachedDiagnosticResult(
  target: string,
  ttlMs: number,
) {
  if (typeof indexedDB === "undefined" || !target) return null;
  const normalizedTarget = target.toLowerCase();
  const db = await openHistoryDb();
  const stored = await new Promise<StoredDiagnosticResult | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(resultStoreName, "readonly");
      const request = tx.objectStore(resultStoreName).get(normalizedTarget);
      request.onsuccess = () =>
        resolve(request.result as StoredDiagnosticResult | undefined);
      request.onerror = () => reject(request.error);
    },
  );

  if (!stored?.savedAt || !stored.result) return null;

  const ageMs = Date.now() - Number(stored.savedAt);
  if (!Number.isFinite(ageMs) || ageMs > ttlMs) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(resultStoreName, "readwrite");
      tx.objectStore(resultStoreName).delete(normalizedTarget);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return null;
  }

  return {
    ...stored.result,
    meta: {
      ...stored.result.meta,
      servedAt: new Date().toISOString(),
      cacheStatus: "BROWSER",
      cacheAgeSeconds: Math.max(0, Math.floor(ageMs / 1000)),
    },
  };
}

export async function writeCachedDiagnosticResult(target: string, result: any) {
  if (typeof indexedDB === "undefined" || !target || !result) return;
  const db = await openHistoryDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(resultStoreName, "readwrite");
    tx.objectStore(resultStoreName).put({
      target: target.toLowerCase(),
      savedAt: Date.now(),
      result,
    } satisfies StoredDiagnosticResult);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useDiagnosticHistory() {
  const [history, setHistory] = useState<StoredDiagnosticTarget[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const h = await readHistory();
      setHistory(h);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const upsertHistory = useCallback(
    async (target: string, isPinned?: boolean) => {
      try {
        await upsertHistoryRecord({
          target,
          lastCheckedAt: new Date().toISOString(),
          pinned: isPinned,
        });
        await loadHistory();
      } catch {
        // ignore
      }
    },
    [loadHistory],
  );

  const deleteHistory = useCallback(
    async (target: string) => {
      try {
        await deleteHistoryTargetRecord(target);
        await loadHistory();
      } catch {
        // ignore
      }
    },
    [loadHistory],
  );

  const togglePin = useCallback(
    async (item: StoredDiagnosticTarget) => {
      try {
        await upsertHistoryRecord({ ...item, pinned: !item.pinned });
        await loadHistory();
      } catch {
        // ignore
      }
    },
    [loadHistory],
  );

  return { history, upsertHistory, deleteHistory, togglePin };
}
