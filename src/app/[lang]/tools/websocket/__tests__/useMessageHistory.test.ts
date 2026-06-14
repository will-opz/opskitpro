import { describe, it, expect } from 'vitest'

// Pure logic mirrors from useMessageHistory.ts — the exportToJson/exportToCsv/exportToHar
// functions depend on DOM (Blob, URL.createObjectURL). We test their data-transformation
// logic by replicating them without the DOM side-effects.

// Inline type to avoid 'use client' import issues
interface LogEntry {
  id: string
  type: 'info' | 'error' | 'sent' | 'received' | 'ping' | 'pong'
  message: string
  messageType: 'text' | 'json' | 'binary'
  size: number
  time: string
  timestamp: number
}

// ─── sessionMessageCount ──────────────────────────────────────────────────────

// The saveSession logic counts sent+received messages; test that counting logic.
function countMessages(logs: LogEntry[]): number {
  return logs.filter(l => l.type === 'sent' || l.type === 'received').length
}

// ─── exportToJson helper (data transformation only) ─────────────────────────

function toJsonExportData(logs: LogEntry[]) {
  return logs.map(log => ({
    time: log.time,
    timestamp: log.timestamp,
    type: log.type,
    messageType: log.messageType,
    message: log.message,
    size: log.size,
  }))
}

// ─── exportToCsv helper ──────────────────────────────────────────────────────

function toCsvString(logs: LogEntry[]): string {
  const headers = ['Time', 'Timestamp', 'Type', 'Message Type', 'Message', 'Size (bytes)']
  const rows = logs.map(log => [
    log.time,
    log.timestamp,
    log.type,
    log.messageType,
    `"${log.message.replace(/"/g, '""')}"`,
    log.size,
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// ─── exportToHar helper ──────────────────────────────────────────────────────

function toHarData(logs: LogEntry[], wsUrl: string) {
  return {
    log: {
      version: '1.2',
      creator: { name: 'OpsKitPro WebSocket Workbench', version: '1.0' },
      entries: [{
        startedDateTime: new Date(logs[0]?.timestamp || Date.now()).toISOString(),
        time: 0,
        request: {
          method: 'GET',
          url: wsUrl,
          httpVersion: 'HTTP/1.1',
          headers: [{ name: 'Upgrade', value: 'websocket' }],
        },
        response: {
          status: 101,
          statusText: 'Switching Protocols',
        },
        _webSocketMessages: logs.map(log => ({
          type: log.type === 'sent' ? 'send' : 'receive',
          time: log.timestamp,
          opcode: log.messageType === 'binary' ? 2 : 1,
          data: log.message,
        })),
      }],
    },
  }
}

// ─── Sample fixtures ─────────────────────────────────────────────────────────

const sampleLogs: LogEntry[] = [
  { id: '1', time: '12:00:00', timestamp: 1700000000000, type: 'sent', messageType: 'text', message: 'hello', size: 5 },
  { id: '2', time: '12:00:01', timestamp: 1700000001000, type: 'received', messageType: 'text', message: 'world', size: 5 },
  { id: '3', time: '12:00:02', timestamp: 1700000002000, type: 'info', messageType: 'text', message: 'connected', size: 9 },
  { id: '4', time: '12:00:03', timestamp: 1700000003000, type: 'sent', messageType: 'binary', message: '\x00\x01', size: 2 },
]

// ─── countMessages ────────────────────────────────────────────────────────────

describe('countMessages — session message counting', () => {
  it('counts sent and received messages only', () => {
    expect(countMessages(sampleLogs)).toBe(3) // 2 sent + 1 received (info excluded)
  })

  it('returns 0 for empty log', () => {
    expect(countMessages([])).toBe(0)
  })

  it('counts only sent messages when no received', () => {
    const logs = sampleLogs.filter(l => l.type === 'sent')
    expect(countMessages(logs)).toBe(2)
  })

  it('excludes info/error/system log types', () => {
    const infoOnly: LogEntry[] = [
      { time: '12:00:00', timestamp: 1700000000000, type: 'info', messageType: 'text', message: 'connected', size: 9 },
    ]
    expect(countMessages(infoOnly)).toBe(0)
  })
})

// ─── toJsonExportData ─────────────────────────────────────────────────────────

describe('toJsonExportData — JSON export transformation', () => {
  it('returns one entry per log', () => {
    const data = toJsonExportData(sampleLogs)
    expect(data).toHaveLength(sampleLogs.length)
  })

  it('each entry has all required fields', () => {
    const data = toJsonExportData(sampleLogs)
    data.forEach(entry => {
      expect(entry).toHaveProperty('time')
      expect(entry).toHaveProperty('timestamp')
      expect(entry).toHaveProperty('type')
      expect(entry).toHaveProperty('messageType')
      expect(entry).toHaveProperty('message')
      expect(entry).toHaveProperty('size')
    })
  })

  it('preserves all field values', () => {
    const data = toJsonExportData([sampleLogs[0]])
    expect(data[0].message).toBe('hello')
    expect(data[0].type).toBe('sent')
    expect(data[0].size).toBe(5)
  })

  it('produces valid JSON when serialized', () => {
    const data = toJsonExportData(sampleLogs)
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow()
  })
})

// ─── toCsvString ─────────────────────────────────────────────────────────────

describe('toCsvString — CSV export transformation', () => {
  it('first line is the header row', () => {
    const csv = toCsvString(sampleLogs)
    const firstLine = csv.split('\n')[0]
    expect(firstLine).toContain('Time')
    expect(firstLine).toContain('Type')
    expect(firstLine).toContain('Message')
  })

  it('produces one row per log entry plus header', () => {
    const csv = toCsvString(sampleLogs)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(sampleLogs.length + 1)
  })

  it('escapes double quotes in message field', () => {
    const logsWithQuotes: LogEntry[] = [{
      time: '12:00:00',
      timestamp: 1700000000000,
      type: 'sent',
      messageType: 'text',
      message: 'say "hello"',
      size: 11,
    }]
    const csv = toCsvString(logsWithQuotes)
    // RFC 4180: inner quotes are doubled
    expect(csv).toContain('""hello""')
  })
})

// ─── toHarData ────────────────────────────────────────────────────────────────

describe('toHarData — HAR export transformation', () => {
  const wsUrl = 'wss://echo.websocket.org'

  it('produces HAR 1.2 format', () => {
    const har = toHarData(sampleLogs, wsUrl)
    expect(har.log.version).toBe('1.2')
  })

  it('sets the correct WebSocket URL', () => {
    const har = toHarData(sampleLogs, wsUrl)
    expect(har.log.entries[0].request.url).toBe(wsUrl)
  })

  it('sets Upgrade: websocket header', () => {
    const har = toHarData(sampleLogs, wsUrl)
    const headers = har.log.entries[0].request.headers
    expect(headers.some(h => h.name === 'Upgrade' && h.value === 'websocket')).toBe(true)
  })

  it('response status is 101 Switching Protocols', () => {
    const har = toHarData(sampleLogs, wsUrl)
    expect(har.log.entries[0].response.status).toBe(101)
  })

  it('maps sent logs to "send" type', () => {
    const har = toHarData(sampleLogs, wsUrl)
    const msgs = har.log.entries[0]._webSocketMessages
    const sentMsgs = msgs.filter(m => m.type === 'send')
    expect(sentMsgs.length).toBeGreaterThan(0)
  })

  it('maps received logs to "receive" type', () => {
    const har = toHarData(sampleLogs, wsUrl)
    const msgs = har.log.entries[0]._webSocketMessages
    const receivedMsgs = msgs.filter(m => m.type === 'receive')
    expect(receivedMsgs.length).toBeGreaterThan(0)
  })

  it('binary messages use opcode 2', () => {
    const har = toHarData(sampleLogs, wsUrl)
    const msgs = har.log.entries[0]._webSocketMessages
    const binaryMsgs = msgs.filter(m => m.opcode === 2)
    expect(binaryMsgs.length).toBeGreaterThan(0)
  })

  it('text messages use opcode 1', () => {
    const har = toHarData(sampleLogs, wsUrl)
    const msgs = har.log.entries[0]._webSocketMessages
    const textMsgs = msgs.filter(m => m.opcode === 1)
    expect(textMsgs.length).toBeGreaterThan(0)
  })

  it('handles empty log gracefully', () => {
    const har = toHarData([], wsUrl)
    expect(har.log.entries[0]._webSocketMessages).toHaveLength(0)
  })
})
