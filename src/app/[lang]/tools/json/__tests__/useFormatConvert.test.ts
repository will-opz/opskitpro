import { describe, it, expect } from 'vitest'
import {
  jsonToYaml,
  yamlToJson,
  jsonToToml,
  tomlToJson,
  detectFormat,
} from '../hooks/useFormatConvert'

// ─── JSON → YAML ──────────────────────────────────────────────────────────────

describe('jsonToYaml', () => {
  it('converts a flat object', () => {
    const { output, error } = jsonToYaml('{"name":"ops","port":8080}')
    expect(error).toBeNull()
    expect(output).toContain('name: ops')
    expect(output).toContain('port: 8080')
  })

  it('converts nested objects', () => {
    const { output, error } = jsonToYaml('{"server":{"host":"localhost","port":3000}}')
    expect(error).toBeNull()
    expect(output).toContain('server:')
    expect(output).toContain('host: localhost')
  })

  it('converts arrays', () => {
    const { output, error } = jsonToYaml('{"tags":["a","b","c"]}')
    expect(error).toBeNull()
    expect(output).toContain('tags:')
    expect(output).toContain('- a')
  })

  it('converts boolean and null values', () => {
    const { output, error } = jsonToYaml('{"enabled":true,"config":null}')
    expect(error).toBeNull()
    expect(output).toContain('enabled: true')
  })

  it('returns error for invalid JSON', () => {
    const { output, error } = jsonToYaml('{bad json}')
    expect(output).toBe('')
    expect(error).not.toBeNull()
  })
})

// ─── YAML → JSON ──────────────────────────────────────────────────────────────

describe('yamlToJson', () => {
  it('converts a flat YAML document', () => {
    const { output, error } = yamlToJson('name: ops\nport: 8080')
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.name).toBe('ops')
    expect(parsed.port).toBe(8080)
  })

  it('converts nested YAML', () => {
    const yaml = 'server:\n  host: localhost\n  port: 3000'
    const { output, error } = yamlToJson(yaml)
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.server.host).toBe('localhost')
  })

  it('converts YAML arrays', () => {
    const yaml = 'tags:\n  - alpha\n  - beta'
    const { output, error } = yamlToJson(yaml)
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.tags).toEqual(['alpha', 'beta'])
  })

  it('returns error for invalid YAML', () => {
    const { output, error } = yamlToJson('key: [unclosed')
    expect(output).toBe('')
    expect(error).not.toBeNull()
  })
})

// ─── JSON → TOML ──────────────────────────────────────────────────────────────

describe('jsonToToml', () => {
  it('converts simple key-value pairs', () => {
    const { output, error } = jsonToToml('{"name":"ops","version":"1.0"}')
    expect(error).toBeNull()
    expect(output).toContain('name = "ops"')
    expect(output).toContain('version = "1.0"')
  })

  it('converts boolean and number values', () => {
    const { output, error } = jsonToToml('{"enabled":true,"count":42}')
    expect(error).toBeNull()
    expect(output).toContain('enabled = true')
    expect(output).toContain('count = 42')
  })

  it('converts empty arrays', () => {
    const { output, error } = jsonToToml('{"items":[]}')
    expect(error).toBeNull()
    expect(output).toContain('items = []')
  })

  it('converts simple arrays', () => {
    const { output, error } = jsonToToml('{"tags":["a","b"]}')
    expect(error).toBeNull()
    expect(output).toContain('tags = ["a", "b"]')
  })

  it('converts nested objects to TOML sections', () => {
    const { output, error } = jsonToToml('{"server":{"host":"localhost"}}')
    expect(error).toBeNull()
    expect(output).toContain('[server]')
    expect(output).toContain('host = "localhost"')
  })

  it('handles null values', () => {
    const { output, error } = jsonToToml('{"empty":null}')
    expect(error).toBeNull()
    expect(output).toContain('empty = "null"')
  })

  it('escapes special characters in strings', () => {
    const { output, error } = jsonToToml('{"msg":"hello\\nworld"}')
    expect(error).toBeNull()
    expect(output).toContain('\\n')
  })

  it('returns error for invalid JSON', () => {
    const { output, error } = jsonToToml('{bad}')
    expect(output).toBe('')
    expect(error).not.toBeNull()
  })
})

// ─── TOML → JSON ──────────────────────────────────────────────────────────────

describe('tomlToJson', () => {
  it('parses simple key-value pairs', () => {
    const { output, error } = tomlToJson('name = "ops"\nport = 8080')
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.name).toBe('ops')
    expect(parsed.port).toBe(8080)
  })

  it('parses boolean values', () => {
    const { output, error } = tomlToJson('enabled = true\ndebug = false')
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.enabled).toBe(true)
    expect(parsed.debug).toBe(false)
  })

  it('parses simple arrays', () => {
    const { output, error } = tomlToJson('tags = ["alpha", "beta"]')
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.tags).toEqual(['alpha', 'beta'])
  })

  it('parses TOML sections', () => {
    const toml = '[server]\nhost = "localhost"\nport = 3000'
    const { output, error } = tomlToJson(toml)
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.server.host).toBe('localhost')
    expect(parsed.server.port).toBe(3000)
  })

  it('skips comments and empty lines', () => {
    const toml = '# comment\nname = "test"\n\nenabled = true'
    const { output, error } = tomlToJson(toml)
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.name).toBe('test')
    expect(parsed.enabled).toBe(true)
  })

  it('handles escaped characters in string values', () => {
    const toml = 'msg = "hello\\nworld"'
    const { output, error } = tomlToJson(toml)
    expect(error).toBeNull()
    const parsed = JSON.parse(output)
    expect(parsed.msg).toContain('\n')
  })
})

// ─── detectFormat ─────────────────────────────────────────────────────────────

describe('detectFormat', () => {
  it('detects JSON objects', () => {
    expect(detectFormat('{"key":"value"}')).toBe('json')
  })

  it('detects JSON arrays', () => {
    expect(detectFormat('[1,2,3]')).toBe('json')
  })

  it('detects TOML by section + key=value pattern', () => {
    const toml = '[server]\nhost = "localhost"'
    expect(detectFormat(toml)).toBe('toml')
  })

  it('defaults to yaml for plain key: value content', () => {
    expect(detectFormat('name: ops\nport: 8080')).toBe('yaml')
  })

  it('defaults to yaml for unrecognized content', () => {
    expect(detectFormat('just some plain text')).toBe('yaml')
  })

  it('detects JSON even with surrounding whitespace', () => {
    expect(detectFormat('  \n  {"key": "value"}  \n  ')).toBe('json')
  })
})
