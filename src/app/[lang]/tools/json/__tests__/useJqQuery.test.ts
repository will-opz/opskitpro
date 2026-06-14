import { describe, it, expect } from 'vitest'
import { JQ_SNIPPETS } from '../hooks/useJqQuery'

// useJqQuery hook relies on browser APIs (WASM jq-web) and React state;
// we test the pure, side-effect-free exports in this file.

describe('JQ_SNIPPETS — catalog integrity', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(JQ_SNIPPETS)).toBe(true)
    expect(JQ_SNIPPETS.length).toBeGreaterThan(0)
  })

  it('every snippet has a non-empty label', () => {
    JQ_SNIPPETS.forEach(s => {
      expect(typeof s.label).toBe('string')
      expect(s.label.length).toBeGreaterThan(0)
    })
  })

  it('every snippet has a non-empty filter', () => {
    JQ_SNIPPETS.forEach(s => {
      expect(typeof s.filter).toBe('string')
      expect(s.filter.length).toBeGreaterThan(0)
    })
  })

  it('every snippet has a description', () => {
    JQ_SNIPPETS.forEach(s => {
      expect(typeof s.desc).toBe('string')
      expect(s.desc.length).toBeGreaterThan(0)
    })
  })

  it('snippet labels are unique', () => {
    const labels = JQ_SNIPPETS.map(s => s.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('contains key snippets: Keys, Length, Sort, Flatten', () => {
    const labels = JQ_SNIPPETS.map(s => s.label)
    expect(labels).toContain('Keys')
    expect(labels).toContain('Length')
    expect(labels).toContain('Sort')
    expect(labels).toContain('Flatten')
  })
})
