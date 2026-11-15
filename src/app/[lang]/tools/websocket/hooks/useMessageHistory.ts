"use client";

import { useState, useEffect, useCallback } from "react";
import type { LogEntry } from "./useWebSocket";

import { MAX_SESSIONS, MAX_SESSION_TEXT, SESSION_STORAGE_KEY, SessionDataError, parseSessions, validateSavedSession, sessionError, type SavedSession, type SessionError } from "./session-data";
export type { SavedSession } from "./session-data";

export function useMessageHistory() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<SessionError | null>(null);

  const reloadSessions = useCallback(() => {
    try {
      const next = parseSessions(localStorage.getItem(SESSION_STORAGE_KEY));
      setSessions(next);
      setError(null);
      return next;
    } catch (cause) {
      setSessions([]);
      setError(sessionError(cause));
      return null;
    } finally { setIsLoaded(true); }
  }, []);
  useEffect(() => { reloadSessions(); }, [reloadSessions]);

  const mutateSessions = useCallback((change: (current: SavedSession[]) => SavedSession[]) => {
    try {
      // Fresh read prevents an outdated list from overwriting another tab or corrupt data.
      const current = parseSessions(localStorage.getItem(SESSION_STORAGE_KEY));
      const next = change(current);
      const raw = JSON.stringify(next);
      if (raw.length > MAX_SESSION_TEXT) throw new SessionDataError('too-large');
      localStorage.setItem(SESSION_STORAGE_KEY, raw);
      setSessions(next);
      setError(null);
      return true;
    } catch (cause) { setError(sessionError(cause)); return false; }
  }, []);

  const saveSession = useCallback((name: string, url: string, logs: LogEntry[]) => {
    return mutateSessions(current => {
      const session = validateSavedSession({ version: 1, id: crypto.randomUUID(),
        name: name.trim() || `Session ${new Date().toLocaleString()}`, url, logs,
        createdAt: Date.now(), messageCount: 0 });
      return [session, ...current.slice(0, MAX_SESSIONS - 1)];
    });
  }, [mutateSessions]);
  const deleteSession = useCallback((id: string) => mutateSessions(current => current.filter(s => s.id !== id)), [mutateSessions]);
  const clearSessions = useCallback(() => mutateSessions(() => []), [mutateSessions]);

  // Export functions
  const exportToJson = useCallback((logs: LogEntry[], filename?: string) => {
    const data = logs.map((log) => ({
      time: log.time,
      timestamp: log.timestamp,
      type: log.type,
      messageType: log.messageType,
      message: log.message,
      size: log.size,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `ws-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToCsv = useCallback((logs: LogEntry[], filename?: string) => {
    const headers = [
      "Time",
      "Timestamp",
      "Type",
      "Message Type",
      "Message",
      "Size (bytes)",
    ];
    const rows = logs.map((log) => [
      log.time,
      log.timestamp,
      log.type,
      log.messageType,
      `"${log.message.replace(/"/g, '""')}"`,
      log.size,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `ws-session-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToHar = useCallback(
    (logs: LogEntry[], wsUrl: string, filename?: string) => {
      // HAR format for WebSocket
      const har = {
        log: {
          version: "1.2",
          creator: { name: "OpsKitPro WebSocket Workbench", version: "1.0" },
          entries: [
            {
              startedDateTime: new Date(
                logs[0]?.timestamp || Date.now(),
              ).toISOString(),
              time: 0,
              request: {
                method: "GET",
                url: wsUrl,
                httpVersion: "HTTP/1.1",
                headers: [{ name: "Upgrade", value: "websocket" }],
                queryString: [],
                cookies: [],
                headersSize: -1,
                bodySize: -1,
              },
              response: {
                status: 101,
                statusText: "Switching Protocols",
                httpVersion: "HTTP/1.1",
                headers: [],
                cookies: [],
                content: { size: 0, mimeType: "application/octet-stream" },
                redirectURL: "",
                headersSize: -1,
                bodySize: -1,
              },
              cache: {},
              timings: { send: 0, wait: 0, receive: 0 },
              _webSocketMessages: logs.map((log) => ({
                type: log.type === "sent" ? "send" : "receive",
                time: log.timestamp,
                opcode: log.messageType === "binary" ? 2 : 1,
                data: log.message,
              })),
            },
          ],
        },
      };

      const blob = new Blob([JSON.stringify(har, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `ws-session-${Date.now()}.har`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  return {
    sessions,
    isLoaded,
    error,
    reloadSessions,
    saveSession,
    deleteSession,
    clearSessions,
    exportToJson,
    exportToCsv,
    exportToHar,
  };
}
