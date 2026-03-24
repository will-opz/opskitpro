// ─── Smart JSON Repair Engine ───

export interface RepairResult {
  repaired: string
  fixes: string[]
}

export function repairJson(input: string): RepairResult {
  const fixes: string[] = []
  let s = input.trim()

  // Remove JS-style single-line comments (// ...)
  const commentSingle = s.match(/\/\/.*/g)
  if (commentSingle && commentSingle.length > 0) {
    s = s.replace(/\/\/.*/g, '')
    fixes.push(`Removed ${commentSingle.length} single-line comment(s)`)
  }

  // Remove JS-style multi-line comments (/* ... */)
  const commentMulti = s.match(/\/\*[\s\S]*?\*\//g)
  if (commentMulti && commentMulti.length > 0) {
    s = s.replace(/\/\*[\s\S]*?\*\//g, '')
    fixes.push(`Removed ${commentMulti.length} multi-line comment(s)`)
  }

  // Replace single quotes with double quotes (for strings)
  if (s.includes("'")) {
    s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
    fixes.push('Converted single quotes → double quotes')
  }

  // Add quotes to unquoted keys: {key: value} → {"key": value}
  const unquotedKeyPattern = /(?<=[\{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g
  const unquotedMatches = s.match(unquotedKeyPattern)
  if (unquotedMatches && unquotedMatches.length > 0) {
    s = s.replace(unquotedKeyPattern, '"$1":')
    fixes.push(`Quoted ${unquotedMatches.length} unquoted key(s)`)
  }

  // Remove trailing commas before } or ]
  const trailingBefore = s
  s = s.replace(/,\s*([}\]])/g, '$1')
  if (s !== trailingBefore) {
    fixes.push('Removed trailing comma(s)')
  }

  // Replace undefined/NaN/Infinity with null
  const specialValuesBefore = s
  s = s.replace(/\bundefined\b/g, 'null')
  s = s.replace(/\bNaN\b/g, 'null')
  s = s.replace(/\bInfinity\b/g, 'null')
  if (s !== specialValuesBefore) {
    fixes.push('Replaced undefined/NaN/Infinity → null')
  }

  // Replace Python types with JSON types
  const pythonTypesBefore = s
  s = s.replace(/\bTrue\b/g, 'true')
  s = s.replace(/\bFalse\b/g, 'false')
  s = s.replace(/\bNone\b/g, 'null')
  if (s !== pythonTypesBefore) {
    fixes.push('Replaced Python-style True/False/None → true/false/null')
  }

  // Add missing commas between objects/arrays (e.g., } { -> }, {)
  const missingCommaObjPattern = /([}\]])\s+([{\[])/g
  const missingCommasObj = s.match(missingCommaObjPattern)
  if (missingCommasObj && missingCommasObj.length > 0) {
    s = s.replace(missingCommaObjPattern, '$1, $2')
    fixes.push(`Added ${missingCommasObj.length} missing comma(s) between structures`)
  }

  // Add missing commas between key-value pairs (e.g., "a": 1 "b": 2 -> "a": 1, "b": 2)
  const missingCommaValPattern = /([}\]"el0-9])\s+(?=")/g
  const missingCommasVal = s.match(missingCommaValPattern)
  if (missingCommasVal && missingCommasVal.length > 0) {
    s = s.replace(missingCommaValPattern, '$1, ')
    fixes.push(`Added ${missingCommasVal.length} missing comma(s) before keys/values`)
  }

  // Convert template literals (backticks) to double quotes
  if (s.includes('`')) {
    s = s.replace(/`([^`\\]*(?:\\.[^`\\]*)*)`/g, '"$1"')
    fixes.push('Converted template literals (backticks) → double quotes')
  }

  // Fix numbers with leading zeros (but not decimals like 0.1)
  const leadingZeroPattern = /(?<=[:[,]\s*)0+(?=[1-9]\d*(\.|$|[^.]))/g
  if (s.match(leadingZeroPattern)) {
    s = s.replace(leadingZeroPattern, '')
    fixes.push('Removed leading zeros from number(s)')
  }

  // Convert hex to decimal
  const hexPattern = /(?<=[:[,]\s*)0x([0-9a-fA-F]+)/g
  const hexMatches = s.match(hexPattern)
  if (hexMatches) {
    s = s.replace(hexPattern, (_match, hex) => parseInt(hex, 16).toString())
    fixes.push(`Converted ${hexMatches.length} hex number(s) → decimal`)
  }

  // Fix unquoted word values (excluding booleans and null)
  const unquotedValPattern = /(?<=:\s*)(?!(?:true|false|null|undefined|NaN))([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[,}\]])/g
  const unquotedValMatches = s.match(unquotedValPattern)
  if (unquotedValMatches) {
    s = s.replace(unquotedValPattern, '"$1"')
    fixes.push(`Quoted ${unquotedValMatches.length} unquoted string value(s)`)
  }

  // ─── Bracket Balancing (position-tracked, handles both missing & extra) ───
  const openerStack: { ch: string; pos: number }[] = []
  const unmatchedClosers: number[] = [] // positions of extra ] or }
  let inString = false
  let escaped = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue

    if (ch === '{' || ch === '[') {
      openerStack.push({ ch, pos: i })
    } else if (ch === '}') {
      if (openerStack.length > 0 && openerStack[openerStack.length - 1].ch === '{') {
        openerStack.pop()
      } else {
        unmatchedClosers.push(i)
      }
    } else if (ch === ']') {
      if (openerStack.length > 0 && openerStack[openerStack.length - 1].ch === '[') {
        openerStack.pop()
      } else {
        unmatchedClosers.push(i)
      }
    }
  }

  if (unmatchedClosers.length > 0) {
    const removed = unmatchedClosers.map(p => s[p]).join('')
    for (let i = unmatchedClosers.length - 1; i >= 0; i--) {
      const pos = unmatchedClosers[i]
      s = s.substring(0, pos) + s.substring(pos + 1)
    }
    fixes.push(`Removed ${unmatchedClosers.length} extra bracket(s) "${removed}"`)
  }

  if (openerStack.length > 0) {
    const closers = openerStack.map(o => o.ch === '{' ? '}' : ']').reverse().join('')
    s += closers
    fixes.push(`Added ${openerStack.length} missing bracket(s) "${closers}"`)
  }

  s = s.trim()

  return { repaired: s, fixes }
}

// ─── JSON Stats ───
export interface JsonStats {
  keys: number
  depth: number
  size: string
  type: string
}

export function getJsonStats(value: string): JsonStats | null {
  try {
    const parsed = JSON.parse(value)
    const bytes = new TextEncoder().encode(value).length
    const size = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
    let maxDepth = 0
    let keyCount = 0
    
    function walk(obj: any, depth: number) {
      if (depth > maxDepth) maxDepth = depth
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          obj.forEach(item => walk(item, depth + 1))
        } else {
          const keys = Object.keys(obj)
          keyCount += keys.length
          keys.forEach(k => walk(obj[k], depth + 1))
        }
      }
    }
    
    walk(parsed, 0)
    const type = Array.isArray(parsed) ? 'Array' : typeof parsed === 'object' && parsed !== null ? 'Object' : typeof parsed
    return { keys: keyCount, depth: maxDepth, size, type }
  } catch {
    return null
  }
}
