import { repairJson, getJsonStats } from '../hooks/useJsonRepair'

describe('repairJson', () => {
  describe('comments', () => {
    it('should remove single-line comments', () => {
      const input = '{"key": "value" // comment\n}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('single-line comment'))).toBe(true)
    })

    it('should remove multi-line comments', () => {
      const input = '{"key": /* comment */ "value"}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('multi-line comment'))).toBe(true)
    })
  })

  describe('quotes', () => {
    it('should convert single quotes to double quotes', () => {
      const input = "{'key': 'value'}"
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('single quotes'))).toBe(true)
    })

    it('should quote unquoted keys', () => {
      const input = '{key: "value"}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('unquoted key'))).toBe(true)
    })
  })

  describe('trailing commas', () => {
    it('should remove trailing commas in objects', () => {
      const input = '{"key": "value",}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('trailing comma'))).toBe(true)
    })

    it('should remove trailing commas in arrays', () => {
      const input = '[1, 2, 3,]'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual([1, 2, 3])
      expect(fixes.some(f => f.includes('trailing comma'))).toBe(true)
    })
  })

  describe('special values', () => {
    it('should replace undefined with null', () => {
      const input = '{"key": undefined}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: null })
      expect(fixes.some(f => f.includes('undefined'))).toBe(true)
    })

    it('should replace NaN with null', () => {
      const input = '{"key": NaN}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: null })
    })

    it('should replace Infinity with null', () => {
      const input = '{"key": Infinity}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: null })
    })
  })

  describe('Python types', () => {
    it('should convert True to true', () => {
      const input = '{"key": True}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: true })
      expect(fixes.some(f => f.includes('Python-style'))).toBe(true)
    })

    it('should convert False to false', () => {
      const input = '{"key": False}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: false })
    })

    it('should convert None to null', () => {
      const input = '{"key": None}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: null })
    })
  })

  describe('brackets', () => {
    it('should add missing closing brackets', () => {
      const input = '{"key": "value"'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('missing bracket'))).toBe(true)
    })

    it('should remove extra closing brackets', () => {
      const input = '{"key": "value"}}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('extra bracket'))).toBe(true)
    })

    it('should handle nested missing brackets', () => {
      const input = '{"outer": {"inner": "value"'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ outer: { inner: 'value' } })
    })
  })

  describe('hex numbers', () => {
    it('should convert hex to decimal', () => {
      const input = '{"value": 0xFF}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ value: 255 })
      expect(fixes.some(f => f.includes('hex'))).toBe(true)
    })
  })

  describe('template literals', () => {
    it('should convert backticks to double quotes', () => {
      const input = '{"key": `value`}'
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value' })
      expect(fixes.some(f => f.includes('template literals'))).toBe(true)
    })
  })

  describe('complex cases', () => {
    it('should handle multiple issues in one input', () => {
      const input = "{key: 'value', /* comment */ trailing: True,}"
      const { repaired, fixes } = repairJson(input)
      expect(JSON.parse(repaired)).toEqual({ key: 'value', trailing: true })
      expect(fixes.length).toBeGreaterThan(2)
    })
  })
})

describe('getJsonStats', () => {
  it('should return null for invalid JSON', () => {
    expect(getJsonStats('not json')).toBeNull()
  })

  it('should calculate stats for simple object', () => {
    const stats = getJsonStats('{"a": 1, "b": 2}')
    expect(stats).not.toBeNull()
    expect(stats?.keys).toBe(2)
    expect(stats?.depth).toBe(1)
    expect(stats?.type).toBe('Object')
  })

  it('should calculate stats for nested object', () => {
    const stats = getJsonStats('{"a": {"b": {"c": 1}}}')
    expect(stats).not.toBeNull()
    expect(stats?.keys).toBe(3)
    expect(stats?.depth).toBe(3)
  })

  it('should identify array type', () => {
    const stats = getJsonStats('[1, 2, 3]')
    expect(stats).not.toBeNull()
    expect(stats?.type).toBe('Array')
    expect(stats?.keys).toBe(0)
  })

  it('should calculate size correctly', () => {
    const smallJson = '{"a": 1}'
    const stats = getJsonStats(smallJson)
    expect(stats?.size).toMatch(/B$/)
  })
})
