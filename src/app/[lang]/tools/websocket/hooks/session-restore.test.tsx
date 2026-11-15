import { act, renderHook, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSessions, validateSavedSession, MAX_SESSION_TEXT, SESSION_STORAGE_KEY } from './session-data';
import { useMessageHistory } from './useMessageHistory';
import { useMultiConnection } from './useMultiConnection';
import { startToolRun } from '@/lib/audience-client';
vi.mock('@/lib/audience-client', () => ({ startToolRun: vi.fn(() => ({ finish: vi.fn() })) }));
const log = { id: 'log', type: 'sent' as const, messageType: 'text' as const, message: 'do not replay', size: 13, time: '12:00:00', timestamp: 1 };
const session = () => ({ id: 'saved', name: 'History', url: 'wss://example.com/history', logs: [log], createdAt: 1, messageCount: 99 });
let data: Map<string, string>;
beforeEach(() => {
  data = new Map();
  vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => data.get(key) ?? null), setItem: vi.fn((key: string, value: string) => data.set(key, value)) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('stored session validation', () => {
  it('accepts legacy/version 1 and copies display history only, recalculating counts', () => {
    const value = { ...session(), socket: {}, config: { autoReconnect: true }, logs: [{ ...log, rawData: { bytes: [1] } }] };
    expect(validateSavedSession(value)).toEqual({ ...session(), version: 1, messageCount: 1 });
    expect(parseSessions(JSON.stringify([{ ...value, version: 1 }]))).toHaveLength(1);
    expect(parseSessions(null)).toEqual([]);
  });
  it.each([
    null, [], {}, { ...session(), version: 2 }, { ...session(), url: 'https://example.com' },
    { ...session(), url: 'wss://example.com/#fragment' }, { ...session(), url: 'wss://user:pass@example.com' },
    { ...session(), createdAt: -1 }, { ...session(), createdAt: 8640000000000001 }, { ...session(), messageCount: 0.5 },
    { ...session(), name: '' }, { ...session(), logs: [null] }, { ...session(), logs: [log, log] },
    { ...session(), logs: [{ ...log, type: 'execute' }] }, { ...session(), logs: [{ ...log, messageType: 'script' }] },
    { ...session(), logs: [{ ...log, timestamp: Infinity }] }, { ...session(), logs: [{ ...log, size: -1 }] },
    { ...session(), logs: [{ ...log, message: {} }] },
  ])('rejects malformed session %#', value => { expect(() => validateSavedSession(value)).toThrow(); });
  it.each(['{broken', '{}', 'null', JSON.stringify([session(), session()])])('rejects corrupt collections %#', raw => {
    expect(() => parseSessions(raw)).toThrow();
  });
  it('rejects oversized data, never truncates; accepts the 500-log boundary', () => {
    const logs = Array.from({ length: 500 }, (_, i) => ({ ...log, id: `${i}` }));
    expect(validateSavedSession({ ...session(), logs }).logs).toHaveLength(500);
    expect(() => validateSavedSession({ ...session(), logs: [...logs, { ...log, id: 'extra' }] })).toThrow('too-large');
    expect(() => parseSessions(' '.repeat(MAX_SESSION_TEXT + 1))).toThrow('too-large');
    expect(() => validateSavedSession({ ...session(), name: 'n'.repeat(201) })).toThrow('too-large');
    expect(() => validateSavedSession({ ...session(), url: `wss://example.com/${'x'.repeat(8192)}` })).toThrow('too-large');
    expect(() => validateSavedSession({ ...session(), logs: [{ ...log, message: 'x'.repeat(MAX_SESSION_TEXT) }] })).toThrow('too-large');
    expect(() => parseSessions(JSON.stringify(Array.from({ length: 11 }, (_, i) => ({ ...session(), id: `${i}` }))))).toThrow('too-large');
  });
});

describe('real storage hook', () => {
  it('does not rewrite legacy data; reports corruption and supports explicit retry', () => {
    data.set(SESSION_STORAGE_KEY, '{broken');
    const { result } = renderHook(useMessageHistory);
    expect(result.current.error).toBe('invalid');
    expect(result.current.sessions).toEqual([]);
    expect(localStorage.setItem).not.toHaveBeenCalled();
    data.set(SESSION_STORAGE_KEY, JSON.stringify([session()]));
    act(() => { result.current.reloadSessions(); });
    expect(result.current.sessions[0].messageCount).toBe(1);
    expect(result.current.error).toBeNull();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('fresh-reads before writes and refuses to overwrite corrupt data, including clear/delete', () => {
    data.set(SESSION_STORAGE_KEY, JSON.stringify([session()]));
    const { result } = renderHook(useMessageHistory);
    data.set(SESSION_STORAGE_KEY, '{broken');
    act(() => {
      expect(result.current.saveSession('New', session().url, [log])).toBe(false);
      expect(result.current.deleteSession('saved')).toBe(false);
      expect(result.current.clearSessions()).toBe(false);
    });
    expect(data.get(SESSION_STORAGE_KEY)).toBe('{broken');
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(result.current.sessions).toHaveLength(1);
  });
  it('preserves newly added external entries and writes validated version 1', () => {
    const { result } = renderHook(useMessageHistory);
    data.set(SESSION_STORAGE_KEY, JSON.stringify([session()]));
    act(() => { expect(result.current.saveSession('New', session().url, [log])).toBe(true); });
    const saved = parseSessions(data.get(SESSION_STORAGE_KEY)!);
    expect(saved.map(s => s.name)).toEqual(['New', 'History']);
    expect(saved.every(s => s.version === 1)).toBe(true);
  });
  it('reports read/write denial without falsely saving or losing current records', () => {
    vi.mocked(localStorage.getItem).mockImplementationOnce(() => { throw new Error('denied'); });
    const { result } = renderHook(useMessageHistory);
    expect(result.current.error).toBe('storage');
    act(() => { result.current.reloadSessions(); });
    vi.mocked(localStorage.setItem).mockImplementationOnce(() => { throw new Error('quota'); });
    act(() => { expect(result.current.saveSession('New', session().url, [log])).toBe(false); });
    expect(result.current.error).toBe('storage');
    expect(result.current.sessions).toEqual([]);
    expect(data.size).toBe(0);
  });
});

class Socket {
  static OPEN = 1;
  static instances: Socket[] = [];
  readyState = 1;
  binaryType = 'arraybuffer';
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  send = vi.fn();
  close = vi.fn();
  constructor(public url: string) { Socket.instances.push(this); }
}
describe('real connection restoration hook', () => {
  beforeEach(() => { Socket.instances = []; vi.stubGlobal('WebSocket', Socket); });
  it('retains a live connection and its logs; restores into an independent disconnected tab without sending or tracking a run', () => {
    const { result } = renderHook(useMultiConnection);
    act(() => { result.current.connect('default', 'wss://example.com/live'); });
    const live = Socket.instances[0];
    act(() => { live.onopen?.(); live.onmessage?.({ data: 'live message' }); });
    const original = result.current.tabs[0];
    vi.mocked(startToolRun).mockClear();
    act(() => { expect(result.current.restoreSession({ ...session(), config: { autoReconnect: true } }).ok).toBe(true); });
    expect(result.current.tabs[0]).toBe(original);
    expect(result.current.activeTab).toMatchObject({ name: 'History', url: session().url, status: 'disconnected', config: { autoReconnect: false, url: session().url }, logs: [log], stats: { messagesSent: 0, messagesReceived: 0, bytesSent: 0, bytesReceived: 0, connectedAt: null, latency: null } });
    expect(Socket.instances).toHaveLength(1);
    expect(live.close).not.toHaveBeenCalled();
    expect(live.send).not.toHaveBeenCalled();
    expect(startToolRun).not.toHaveBeenCalled();
    act(() => { live.onmessage?.({ data: 'still alive' }); });
    expect(result.current.tabs[0].logs.at(-1)?.message).toBe('still alive');
    expect(result.current.activeTab.logs).toEqual([log]);
    act(() => { result.current.connect(result.current.activeTabId, result.current.activeTab.url); });
    expect(Socket.instances).toHaveLength(2);
    expect(Socket.instances[1].send).not.toHaveBeenCalled();
  });
  it('enforces five tabs atomically across repeated restore/add, with unique IDs and recoverable capacity', () => {
    const { result } = renderHook(useMultiConnection);
    act(() => {
      result.current.addTab();
      for (let i = 0; i < 3; i++) expect(result.current.restoreSession(session()).ok).toBe(true);
      expect(result.current.restoreSession(session())).toEqual({ ok: false, error: 'limit' });
      expect(result.current.addTab()).toBeNull();
    });
    expect(result.current.tabs).toHaveLength(5);
    expect(new Set(result.current.tabs.map(t => t.id)).size).toBe(5);
    act(() => { result.current.removeTab(result.current.activeTabId); });
    act(() => { expect(result.current.restoreSession(session()).ok).toBe(true); });
    expect(result.current.tabs).toHaveLength(5);
    expect(Socket.instances).toHaveLength(0);
  });
  it('rejects corrupted direct loads without changing tabs or active selection', () => {
    const { result } = renderHook(useMultiConnection);
    const original = result.current.tabs;
    act(() => { expect(result.current.restoreSession({ ...session(), logs: [null] })).toEqual({ ok: false, error: 'invalid' }); });
    expect(result.current.tabs).toBe(original);
    expect(result.current.activeTabId).toBe('default');
    expect(Socket.instances).toHaveLength(0);
  });
});
