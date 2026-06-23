import React from 'react'

interface ApiUsageProps {
  endpoint: string
  exampleCurl: string
  exampleResponse: string
}

export function ApiUsageSnippet({ endpoint, exampleCurl, exampleResponse }: ApiUsageProps) {
  return (
    <div className="mt-12 bg-white/50 border border-zinc-100 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-semibold text-zinc-800 mb-2">Developer API</h2>
      <p className="text-zinc-500 text-sm mb-6">
        You can use this tool directly from your terminal or scripts via our Public JSON API.
      </p>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Endpoint</h3>
        <code className="px-2 py-1 bg-zinc-100 text-zinc-800 rounded text-sm break-all">
          {endpoint}
        </code>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Example Request</h3>
        <pre className="bg-[#1e1e1e] text-zinc-300 p-4 rounded-xl text-sm overflow-x-auto">
          <code>{exampleCurl}</code>
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Example Response</h3>
        <pre className="bg-[#1e1e1e] text-zinc-300 p-4 rounded-xl text-[13px] overflow-x-auto">
          <code>{exampleResponse}</code>
        </pre>
      </div>
    </div>
  )
}
