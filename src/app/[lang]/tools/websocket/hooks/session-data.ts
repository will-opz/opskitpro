import type { LogEntry } from './useWebSocket';

export interface SavedSession {
  version?: 1;
  id: string;
  name: string;
  url: string;
  logs: LogEntry[];
  createdAt: number;
  messageCount: number;
}

export const SESSION_STORAGE_KEY = 'opskitpro_ws_sessions';
export const MAX_SESSIONS = 10;
export const MAX_SESSION_LOGS = 500;
// UTF-16 code units, measured before parsing. Reject, never truncate history.
export const MAX_SESSION_TEXT = 2_000_000;
export type SessionError = 'invalid' | 'too-large' | 'unsupported' | 'storage' | 'limit';
export class SessionDataError extends Error {
  constructor(public code: SessionError) { super(code); }
}
function invalid(): never { throw new SessionDataError('invalid'); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.trim())) return invalid();
  if (value.length > max) throw new SessionDataError('too-large');
  return value;
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) return invalid();
  return value;
}

/** Copies only display history; saved socket/config/raw binary objects are never restored. */
export function validateSavedSession(value: unknown): SavedSession {
  const s = record(value);
  if (s.version !== undefined && s.version !== 1) throw new SessionDataError('unsupported');
  const url = text(s.url, 8192);
  try {
    const parsed = new URL(url);
    if (!['ws:', 'wss:'].includes(parsed.protocol) || !parsed.hostname || parsed.hash || parsed.username || parsed.password) return invalid();
  } catch { return invalid(); }
  if (!Array.isArray(s.logs)) return invalid();
  if (s.logs.length > MAX_SESSION_LOGS) throw new SessionDataError('too-large');
  const ids = new Set<string>();
  const logs: LogEntry[] = s.logs.map(value => {
    const log = record(value);
    const id = text(log.id, 200);
    if (ids.has(id)) return invalid();
    ids.add(id);
    if (!['info', 'error', 'sent', 'received', 'ping', 'pong'].includes(log.type as string) ||
        !['text', 'json', 'binary'].includes(log.messageType as string)) return invalid();
    return { id, type: log.type as LogEntry['type'], messageType: log.messageType as LogEntry['messageType'],
      message: text(log.message, MAX_SESSION_TEXT, true), time: text(log.time, 100),
      timestamp: integer(log.timestamp, 8_640_000_000_000_000), size: integer(log.size) };
  });
  integer(s.messageCount);
  const session: SavedSession = { version: 1, id: text(s.id, 200), name: text(s.name, 200), url,
    createdAt: integer(s.createdAt, 8_640_000_000_000_000), logs,
    messageCount: logs.filter(l => l.type === 'sent' || l.type === 'received').length };
  if (JSON.stringify(session).length > MAX_SESSION_TEXT) throw new SessionDataError('too-large');
  return session;
}

export function parseSessions(raw: string | null): SavedSession[] {
  if (raw === null) return [];
  if (raw.length > MAX_SESSION_TEXT) throw new SessionDataError('too-large');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid(); }
  if (!Array.isArray(value)) return invalid();
  if (value.length > MAX_SESSIONS) throw new SessionDataError('too-large');
  const sessions = value.map(validateSavedSession);
  if (new Set(sessions.map(s => s.id)).size !== sessions.length) return invalid();
  return sessions;
}

export const sessionError = (error: unknown): SessionError => error instanceof SessionDataError ? error.code : 'storage';
