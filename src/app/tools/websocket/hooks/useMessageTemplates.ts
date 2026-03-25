'use client'

import { useState, useEffect, useCallback } from 'react'

export interface MessageTemplate {
  id: string
  name: string
  content: string
  category: 'custom' | 'preset'
  createdAt: number
}

const PRESET_TEMPLATES: MessageTemplate[] = [
  {
    id: 'ping',
    name: 'Ping',
    content: '{"type":"ping","timestamp":{{timestamp}}}',
    category: 'preset',
    createdAt: 0
  },
  {
    id: 'subscribe',
    name: 'Subscribe',
    content: '{"action":"subscribe","channel":"{{channel}}"}',
    category: 'preset',
    createdAt: 0
  },
  {
    id: 'unsubscribe',
    name: 'Unsubscribe',
    content: '{"action":"unsubscribe","channel":"{{channel}}"}',
    category: 'preset',
    createdAt: 0
  },
  {
    id: 'auth',
    name: 'Auth Token',
    content: '{"type":"auth","token":"{{token}}"}',
    category: 'preset',
    createdAt: 0
  },
  {
    id: 'message',
    name: 'Message',
    content: '{"type":"message","data":"{{data}}"}',
    category: 'preset',
    createdAt: 0
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    content: '{"type":"heartbeat"}',
    category: 'preset',
    createdAt: 0
  }
]

const STORAGE_KEY = 'opskitpro_ws_templates'
const MAX_CUSTOM_TEMPLATES = 20

export function useMessageTemplates() {
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCustomTemplates(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load templates:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  const saveTemplates = useCallback((templates: MessageTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
      setCustomTemplates(templates)
    } catch (e) {
      console.error('Failed to save templates:', e)
    }
  }, [])

  const addTemplate = useCallback((name: string, content: string) => {
    const newTemplate: MessageTemplate = {
      id: `custom_${Date.now()}`,
      name,
      content,
      category: 'custom',
      createdAt: Date.now()
    }
    saveTemplates([newTemplate, ...customTemplates.slice(0, MAX_CUSTOM_TEMPLATES - 1)])
    return newTemplate
  }, [customTemplates, saveTemplates])

  const updateTemplate = useCallback((id: string, updates: Partial<MessageTemplate>) => {
    saveTemplates(customTemplates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ))
  }, [customTemplates, saveTemplates])

  const deleteTemplate = useCallback((id: string) => {
    saveTemplates(customTemplates.filter(t => t.id !== id))
  }, [customTemplates, saveTemplates])

  // Process template variables
  const processTemplate = useCallback((template: string, vars: Record<string, string> = {}) => {
    let processed = template
    
    // Built-in variables
    processed = processed.replace(/\{\{timestamp\}\}/g, String(Date.now()))
    processed = processed.replace(/\{\{uuid\}\}/g, crypto.randomUUID())
    processed = processed.replace(/\{\{random\}\}/g, String(Math.floor(Math.random() * 10000)))
    
    // Custom variables
    for (const [key, value] of Object.entries(vars)) {
      processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    
    return processed
  }, [])

  // Extract variable placeholders from template
  const extractVariables = useCallback((template: string): string[] => {
    const matches = template.match(/\{\{(\w+)\}\}/g) || []
    const vars = matches.map(m => m.slice(2, -2))
    // Filter out built-in vars
    return [...new Set(vars)].filter(v => !['timestamp', 'uuid', 'random'].includes(v))
  }, [])

  const allTemplates = [...PRESET_TEMPLATES, ...customTemplates]

  return {
    templates: allTemplates,
    presetTemplates: PRESET_TEMPLATES,
    customTemplates,
    isLoaded,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    processTemplate,
    extractVariables
  }
}
