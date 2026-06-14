'use client'

import { useState, useMemo, useEffect } from 'react'
import { Shield, CheckCircle2, XCircle, AlertTriangle, Sparkles, Copy, Check } from 'lucide-react'

// Dynamic import Ajv to avoid SSR issues
let Ajv: any = null
let addFormats: any = null

interface ValidationError {
  path: string
  message: string
  keyword: string
}

interface SchemaValidatorProps {
  inputJson: string
  dict: any
}

// Infer JSON Schema from data
function inferSchema(data: any, path = ''): any {
  if (data === null) return { type: 'null' }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return { type: 'array', items: {} }
    // Use first item to infer array item schema
    return {
      type: 'array',
      items: inferSchema(data[0], `${path}[]`)
    }
  }
  
  if (typeof data === 'object') {
    const properties: Record<string, any> = {}
    const required: string[] = []
    
    for (const [key, value] of Object.entries(data)) {
      properties[key] = inferSchema(value, path ? `${path}.${key}` : key)
      if (value !== null && value !== undefined) {
        required.push(key)
      }
    }
    
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    }
  }
  
  if (typeof data === 'string') {
    // Try to detect formats
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return { type: 'string', format: 'date' }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) return { type: 'string', format: 'date-time' }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) return { type: 'string', format: 'email' }
    if (/^https?:\/\//.test(data)) return { type: 'string', format: 'uri' }
    return { type: 'string' }
  }
  
  if (typeof data === 'number') {
    return Number.isInteger(data) ? { type: 'integer' } : { type: 'number' }
  }
  
  if (typeof data === 'boolean') return { type: 'boolean' }
  
  return {}
}

export function SchemaValidator({ inputJson, dict }: SchemaValidatorProps) {
  const [schema, setSchema] = useState('')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load Ajv dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadAjv = async () => {
      try {
        const ajvModule = await import('ajv')
        const formatsModule = await import('ajv-formats')
        Ajv = ajvModule.default
        addFormats = formatsModule.default
        setIsReady(true)
      } catch (err) {
        console.error('Failed to load Ajv:', err)
      }
    }
    loadAjv()
  }, [])

  // Infer schema from input
  const inferredSchema = useMemo(() => {
    if (!inputJson.trim()) return null
    try {
      const data = JSON.parse(inputJson)
      return {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        ...inferSchema(data)
      }
    } catch {
      return null
    }
  }, [inputJson])

  // Validate on schema change
  useEffect(() => {
    if (!isReady || !inputJson.trim() || !schema.trim()) {
      setIsValid(null)
      setErrors([])
      return
    }

    try {
      const data = JSON.parse(inputJson)
      const schemaObj = JSON.parse(schema)
      
      const ajv = new Ajv({ allErrors: true, verbose: true })
      addFormats(ajv)
      
      const validate = ajv.compile(schemaObj)
      const valid = validate(data)
      
      setIsValid(valid)
      
      if (!valid && validate.errors) {
        setErrors(validate.errors.map((e: any) => ({
          path: e.instancePath || '(root)',
          message: e.message || 'Unknown error',
          keyword: e.keyword
        })))
      } else {
        setErrors([])
      }
    } catch (err: any) {
      setIsValid(false)
      setErrors([{ path: '(schema)', message: err.message, keyword: 'parse' }])
    }
  }, [inputJson, schema, isReady])

  const useInferredSchema = () => {
    if (inferredSchema) {
      setSchema(JSON.stringify(inferredSchema, null, 2))
    }
  }

  const copySchema = () => {
    if (!schema) return
    navigator.clipboard.writeText(schema)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-2 text-purple-600">
          <Shield className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">JSON Schema Validator</span>
        </div>
        
        {isValid !== null && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold ${
            isValid 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {isValid ? 'VALID' : `${errors.length} ERROR${errors.length !== 1 ? 'S' : ''}`}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 overflow-hidden">
        {/* Schema input */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600">Schema</span>
            <div className="flex items-center gap-2">
              {inferredSchema && (
                <button
                  onClick={useInferredSchema}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 rounded text-[10px] font-mono text-purple-600 hover:bg-purple-50 transition-all"
                >
                  <Sparkles className="w-3 h-3" /> Infer
                </button>
              )}
              <button
                onClick={copySchema}
                disabled={!schema}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-mono text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-30"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <textarea
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            placeholder='Paste JSON Schema here, or click "Infer" to generate from data...'
            className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-zinc-600 bg-white resize-none focus:outline-none placeholder:text-zinc-300"
            spellCheck={false}
          />
        </div>

        {/* Validation results */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Validation Result</span>
          </div>
          
          <div className="flex-1 overflow-auto">
            {!isReady && (
              <div className="p-4 text-center text-zinc-400">
                <div className="w-5 h-5 border-2 border-zinc-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[11px] font-mono">Loading validator...</p>
              </div>
            )}

            {isReady && isValid === null && (
              <div className="p-8 text-center text-zinc-400">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[11px] font-mono">Enter a schema to validate</p>
              </div>
            )}

            {isValid === true && (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-emerald-700">Validation Passed</p>
                <p className="text-[11px] text-zinc-400 mt-1 font-mono">Data conforms to schema</p>
              </div>
            )}

            {isValid === false && errors.length > 0 && (
              <div className="divide-y divide-zinc-100">
                {errors.map((error, idx) => (
                  <div key={idx} className="px-4 py-3 bg-red-50/50 hover:bg-red-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <code className="text-[11px] font-mono font-semibold text-red-700">{error.path}</code>
                        <p className="text-[11px] text-red-600 mt-0.5">{error.message}</p>
                        <span className="text-[9px] font-mono text-red-400 uppercase">{error.keyword}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
