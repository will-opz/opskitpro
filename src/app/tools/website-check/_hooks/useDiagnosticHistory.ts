import { useState, useEffect, useCallback } from 'react'

export type StoredDiagnosticTarget = {
  target: string
  lastCheckedAt: string
  pinned?: boolean
}

const historyStoreName = 'diagnostic-targets'
const historyDbName = 'opskitpro-diagnostics'

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(historyDbName, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(historyStoreName)) {
        db.createObjectStore(historyStoreName, { keyPath: 'target' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readHistory(): Promise<StoredDiagnosticTarget[]> {
  if (typeof indexedDB === 'undefined') return []
  const db = await openHistoryDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(historyStoreName, 'readonly')
    const request = tx.objectStore(historyStoreName).getAll()
    request.onsuccess = () => {
      resolve((request.result as StoredDiagnosticTarget[])
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.lastCheckedAt).localeCompare(a.lastCheckedAt))
        .slice(0, 20))
    }
    request.onerror = () => reject(request.error)
  })
}

async function upsertHistoryRecord(item: StoredDiagnosticTarget) {
  if (typeof indexedDB === 'undefined') return
  const existing = await readHistory()
  const previous = existing.find((entry) => entry.target === item.target)
  const db = await openHistoryDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(historyStoreName, 'readwrite')
    tx.objectStore(historyStoreName).put({ ...previous, ...item })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function deleteHistoryTargetRecord(target: string) {
  if (typeof indexedDB === 'undefined') return
  const db = await openHistoryDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(historyStoreName, 'readwrite')
    tx.objectStore(historyStoreName).delete(target)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function useDiagnosticHistory() {
  const [history, setHistory] = useState<StoredDiagnosticTarget[]>([])

  const loadHistory = useCallback(async () => {
    try {
      const h = await readHistory()
      setHistory(h)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const upsertHistory = useCallback(async (target: string, isPinned?: boolean) => {
    try {
      await upsertHistoryRecord({ target, lastCheckedAt: new Date().toISOString(), pinned: isPinned })
      await loadHistory()
    } catch {
      // ignore
    }
  }, [loadHistory])

  const deleteHistory = useCallback(async (target: string) => {
    try {
      await deleteHistoryTargetRecord(target)
      await loadHistory()
    } catch {
      // ignore
    }
  }, [loadHistory])

  const togglePin = useCallback(async (item: StoredDiagnosticTarget) => {
    try {
      await upsertHistoryRecord({ ...item, pinned: !item.pinned })
      await loadHistory()
    } catch {
      // ignore
    }
  }, [loadHistory])

  return { history, upsertHistory, deleteHistory, togglePin }
}
