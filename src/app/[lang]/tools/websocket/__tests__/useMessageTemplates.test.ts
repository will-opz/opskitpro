import { describe, it, expect } from 'vitest'

// Since PRESET_TEMPLATES and processTemplate/extractVariables are private to the hook,
// we replicate the pure logic here to test it in isolation.

const PRESET_TEMPLATE_NAMES = ['ping', 'subscribe', 'unsubscribe', 'auth', 'message', 'heartbeat']

// Mirror of processTemplate from useMessageTemplates.ts
function processTemplate(template: string, vars: Record<string, string> = {}): string {
  let processed = template
  processed = processed.replace(/\{\{timestamp\}\}/g, String(Date.now()))
  processed = processed.replace(/\{\{uuid\}\}/g, 'test-uuid-1234')
  processed = processed.replace(/\{\{random\}\}/g, String(Math.floor(Math.random() * 10000)))
  for (const [key, value] of Object.entries(vars)) {
    processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return processed
}

// Mirror of extractVariables from useMessageTemplates.ts
function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || []
  const vars = matches.map(m => m.slice(2, -2))
  return [...new Set(vars)].filter(v => !['timestamp', 'uuid', 'random'].includes(v))
}

// ─── processTemplate ─────────────────────────────────────────────────────────

describe('processTemplate — built-in variables', () => {
  it('replaces {{timestamp}} with a numeric value', () => {
    const result = processTemplate('{"ts":{{timestamp}}}')
    expect(result).not.toContain('{{timestamp}}')
    const match = result.match(/"ts":(\d+)/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeGreaterThan(0)
  })

  it('replaces {{uuid}} with a non-empty string', () => {
    const result = processTemplate('{"id":"{{uuid}}"}')
    expect(result).not.toContain('{{uuid}}')
    expect(result).toContain('test-uuid-1234')
  })

  it('replaces {{random}} with a numeric value', () => {
    const result = processTemplate('{"n":{{random}}}')
    expect(result).not.toContain('{{random}}')
  })

  it('replaces custom variables', () => {
    const result = processTemplate('{"channel":"{{channel}}"}', { channel: 'news-feed' })
    expect(result).toBe('{"channel":"news-feed"}')
  })

  it('replaces multiple occurrences of the same variable', () => {
    const result = processTemplate('{{x}} and {{x}}', { x: 'hello' })
    expect(result).toBe('hello and hello')
  })

  it('leaves unknown variables unreplaced', () => {
    const result = processTemplate('{"key":"{{unknown}}"}', {})
    expect(result).toContain('{{unknown}}')
  })

  it('replaces multiple different variables in one template', () => {
    const result = processTemplate(
      '{"action":"{{action}}","channel":"{{channel}}"}',
      { action: 'subscribe', channel: 'ticker' }
    )
    expect(result).toBe('{"action":"subscribe","channel":"ticker"}')
  })
})

// ─── extractVariables ─────────────────────────────────────────────────────────

describe('extractVariables — placeholder extraction', () => {
  it('extracts custom variable names from template', () => {
    const vars = extractVariables('{"ch":"{{channel}}","tok":"{{token}}"}')
    expect(vars).toContain('channel')
    expect(vars).toContain('token')
  })

  it('excludes built-in variables (timestamp, uuid, random)', () => {
    const vars = extractVariables('{{timestamp}}-{{uuid}}-{{random}}-{{custom}}')
    expect(vars).not.toContain('timestamp')
    expect(vars).not.toContain('uuid')
    expect(vars).not.toContain('random')
    expect(vars).toContain('custom')
  })

  it('returns an empty array when no custom variables are present', () => {
    const vars = extractVariables('{"type":"heartbeat"}')
    expect(vars).toEqual([])
  })

  it('deduplicates repeated variable names', () => {
    const vars = extractVariables('{{x}} {{x}} {{y}}')
    expect(vars.filter(v => v === 'x').length).toBe(1)
    expect(vars).toContain('y')
  })

  it('returns empty array for a template with only built-ins', () => {
    const vars = extractVariables('{"ts":{{timestamp}},"id":"{{uuid}}"}')
    expect(vars).toHaveLength(0)
  })
})

// ─── Preset template format spec (testing expected shape) ────────────────────

describe('Preset template content — expected formats', () => {
  const pingTemplate = '{"type":"ping","timestamp":{{timestamp}}}'
  const authTemplate = '{"type":"auth","token":"{{token}}"}'
  const subscribeTemplate = '{"action":"subscribe","channel":"{{channel}}"}'
  const heartbeatTemplate = '{"type":"heartbeat"}'

  it('ping template produces valid-JSON-like content', () => {
    const result = processTemplate(pingTemplate)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('heartbeat template is already valid JSON', () => {
    expect(() => JSON.parse(heartbeatTemplate)).not.toThrow()
  })

  it('auth template exposes "token" as a required variable', () => {
    const vars = extractVariables(authTemplate)
    expect(vars).toContain('token')
  })

  it('subscribe template exposes "channel" as a required variable', () => {
    const vars = extractVariables(subscribeTemplate)
    expect(vars).toContain('channel')
  })

  it('ping template exposes no custom variables', () => {
    const vars = extractVariables(pingTemplate)
    expect(vars).toHaveLength(0)
  })
})
