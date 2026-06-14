import yaml from 'js-yaml'

export type ConvertFormat = 'json' | 'yaml' | 'toml'

export interface ConvertResult {
  output: string
  error: string | null
}

// JSON → YAML
export function jsonToYaml(json: string): ConvertResult {
  try {
    const parsed = JSON.parse(json)
    const output = yaml.dump(parsed, {
      indent: 2,
      lineWidth: -1, // no line wrapping
      noRefs: true,
      sortKeys: false,
    })
    return { output, error: null }
  } catch (err: any) {
    return { output: '', error: err.message }
  }
}

// YAML → JSON
export function yamlToJson(yamlStr: string): ConvertResult {
  try {
    const parsed = yaml.load(yamlStr)
    const output = JSON.stringify(parsed, null, 2)
    return { output, error: null }
  } catch (err: any) {
    return { output: '', error: err.message }
  }
}

// Simple TOML parser (basic support)
export function jsonToToml(json: string): ConvertResult {
  try {
    const parsed = JSON.parse(json)
    const output = objectToToml(parsed)
    return { output, error: null }
  } catch (err: any) {
    return { output: '', error: err.message }
  }
}

// Helper: Convert object to TOML string
function objectToToml(obj: any, prefix = ''): string {
  const lines: string[] = []
  const tables: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value === null || value === undefined) {
      lines.push(`${key} = "null"`)
    } else if (typeof value === 'string') {
      lines.push(`${key} = "${escapeTomlString(value)}"`)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key} = ${value}`)
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key} = []`)
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        // Array of tables
        for (const item of value) {
          tables.push(`\n[[${fullKey}]]`)
          tables.push(objectToToml(item))
        }
      } else {
        // Simple array
        const items = value.map(v => 
          typeof v === 'string' ? `"${escapeTomlString(v)}"` : String(v)
        ).join(', ')
        lines.push(`${key} = [${items}]`)
      }
    } else if (typeof value === 'object') {
      tables.push(`\n[${fullKey}]`)
      tables.push(objectToToml(value))
    }
  }

  return [...lines, ...tables].join('\n')
}

function escapeTomlString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
}

// Basic TOML → JSON (simple cases only)
export function tomlToJson(toml: string): ConvertResult {
  try {
    const result: any = {}
    let currentSection = result
    let currentPath: string[] = []

    const lines = toml.split('\n')

    for (let line of lines) {
      line = line.trim()
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue

      // Section header [section] or [[array]]
      const sectionMatch = line.match(/^\[+([^\]]+)\]+$/)
      if (sectionMatch) {
        const isArray = line.startsWith('[[')
        const path = sectionMatch[1].split('.')
        
        let target = result
        for (let i = 0; i < path.length; i++) {
          const key = path[i]
          if (i === path.length - 1 && isArray) {
            if (!target[key]) target[key] = []
            target[key].push({})
            target = target[key][target[key].length - 1]
          } else {
            if (!target[key]) target[key] = {}
            target = target[key]
          }
        }
        currentSection = target
        currentPath = path
        continue
      }

      // Key-value pair
      const kvMatch = line.match(/^([^=]+)=(.*)$/)
      if (kvMatch) {
        const key = kvMatch[1].trim()
        let value = kvMatch[2].trim()

        // Parse value
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '\t')
          currentSection[key] = value
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Array
          const arrContent = value.slice(1, -1)
          const items = arrContent.split(',').map(s => {
            s = s.trim()
            if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1)
            if (s === 'true') return true
            if (s === 'false') return false
            const num = Number(s)
            return isNaN(num) ? s : num
          })
          currentSection[key] = items
        } else if (value === 'true') {
          currentSection[key] = true
        } else if (value === 'false') {
          currentSection[key] = false
        } else {
          const num = Number(value)
          currentSection[key] = isNaN(num) ? value : num
        }
      }
    }

    return { output: JSON.stringify(result, null, 2), error: null }
  } catch (err: any) {
    return { output: '', error: err.message }
  }
}

// Detect format from content
export function detectFormat(content: string): ConvertFormat {
  const trimmed = content.trim()
  
  // JSON starts with { or [
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {}
  }

  // TOML has [sections] and key = value
  if (/^\[[^\]]+\]/m.test(trimmed) && /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/m.test(trimmed)) {
    return 'toml'
  }

  // Default to YAML (most permissive)
  return 'yaml'
}
