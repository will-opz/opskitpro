import React from "react";
import Link from "next/link";

interface ApiUsageProps {
  lang: "en" | "zh";
  endpoint: string;
  exampleCurl: string;
  exampleResponse: string;
  parameterHint?: string;
  abbreviatedResponse?: boolean;
}

const copy = {
  en: {
    title: "Developer API",
    description:
      "Call this tool directly from your terminal or scripts through the public JSON API.",
    endpoint: "Endpoint",
    request: "Example Request",
    response: "Example Response",
    abbreviated: "The response below is abbreviated to show the key fields.",
    docs: "View limits and error contracts",
  },
  zh: {
    title: "开发者 API",
    description: "你可以直接在终端或脚本中通过公开 JSON API 调用此工具。",
    endpoint: "接口",
    request: "请求示例",
    response: "响应示例",
    abbreviated: "以下响应已精简，仅展示关键字段。",
    docs: "查看限流与错误契约",
  },
} as const;

export function ApiUsageSnippet({
  lang,
  endpoint,
  exampleCurl,
  exampleResponse,
  parameterHint,
  abbreviatedResponse = false,
}: ApiUsageProps) {
  const text = copy[lang];

  return (
    <div className="mt-12 bg-white/50 border border-zinc-100 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-semibold text-zinc-800 mb-2">{text.title}</h2>
      <p className="text-zinc-500 text-sm mb-3">{text.description}</p>
      {parameterHint && (
        <p className="mb-6 text-sm leading-6 text-zinc-500">{parameterHint}</p>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">
          {text.endpoint}
        </h3>
        <code className="px-2 py-1 bg-zinc-100 text-zinc-800 rounded text-sm break-all">
          {endpoint}
        </code>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-700 mb-2">
          {text.request}
        </h3>
        <pre className="bg-[#1e1e1e] text-zinc-300 p-4 rounded-xl text-sm overflow-x-auto">
          <code>{exampleCurl}</code>
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 mb-2">
          {text.response}
        </h3>
        {abbreviatedResponse && (
          <p className="mb-2 text-xs text-zinc-500">{text.abbreviated}</p>
        )}
        <pre className="bg-[#1e1e1e] text-zinc-300 p-4 rounded-xl text-[13px] overflow-x-auto">
          <code>{exampleResponse}</code>
        </pre>
      </div>

      <Link
        href={`/${lang}/tools/api`}
        className="mt-5 inline-flex text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
      >
        {text.docs} →
      </Link>
    </div>
  );
}
