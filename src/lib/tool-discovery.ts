import { productTools } from "./tool-catalog";
import { toolGuides } from "./tool-guides";
import { SITE_URL } from "./seo";

export const TOOL_MANIFEST_SCHEMA_VERSION = "opskitpro.tools.v1";
export const TOOL_MANIFEST_VERSION = "2.0.0";

export function buildToolManifest() {
  return {
    schemaVersion: TOOL_MANIFEST_SCHEMA_VERSION,
    version: TOOL_MANIFEST_VERSION,
    canonicalUrl: `${SITE_URL}/api/tools`,
    site: {
      name: "OpsKitPro",
      url: SITE_URL,
      languages: ["en", "zh"],
      privacy: {
        en: `${SITE_URL}/en/privacy`,
        zh: `${SITE_URL}/zh/privacy`,
      },
    },
    tools: productTools.map((tool) => {
      const guide = toolGuides[tool.id];
      return {
        id: tool.id,
        category: tool.category,
        taskCategory: tool.taskCategory,
        processingMode: tool.processingMode,
        networkPath: tool.networkPath,
        inputType: tool.inputType,
        version: "1.0.0",
        requiresLogin: false,
        observationPoints: tool.observationPoints,
        urls: {
          en: `${SITE_URL}/en${tool.href}`,
          zh: `${SITE_URL}/zh${tool.href}`,
        },
        name: tool.title,
        description: tool.description,
        input: guide.input,
        output: guide.output,
        processing: guide.processing,
        privacy: guide.privacy,
        limitations: guide.limitation,
        example: guide.example,
        capabilities: {
          en: [guide.purpose.en, guide.output.en],
          zh: [guide.purpose.zh, guide.output.zh],
        },
        lastReviewed: guide.lastReviewed,
      };
    }),
  };
}

export function buildLlmsTxt() {
  const lines = [
    "# OpsKitPro",
    "",
    "> Free, no-login website diagnostics, network checks, developer utilities, and everyday browser tools.",
    "",
    `Canonical site: ${SITE_URL}`,
    `Tool manifest: ${SITE_URL}/api/tools`,
    `Remote MCP server: ${SITE_URL}/mcp`,
    `MCP documentation: English (${SITE_URL}/en/mcp) and Simplified Chinese (${SITE_URL}/zh/mcp)`,
    `Languages: English (${SITE_URL}/en/tools) and Simplified Chinese (${SITE_URL}/zh/tools)`,
    "",
    "## Use and privacy",
    "",
    "Tools explicitly state whether processing occurs in the browser, at Cloudflare edge, or through the OpsKitPro Probe. Do not submit secrets, private hosts, tokens, or personal data to server-assisted tools.",
    `Privacy: ${SITE_URL}/en/privacy | ${SITE_URL}/zh/privacy`,
    "",
    "## Tools",
    "",
  ];

  for (const tool of productTools) {
    const guide = toolGuides[tool.id];
    lines.push(
      `- [${tool.title.en}](${SITE_URL}/en${tool.href}): ${tool.description.en}`,
      `  Chinese: [${tool.title.zh}](${SITE_URL}/zh${tool.href})`,
      `  Processing: ${guide.processing.en}`,
      `  Limitation: ${guide.limitation.en}`,
    );
  }

  lines.push(
    "",
    "## MCP",
    "",
    `- OpsKitPro exposes a read-only Streamable HTTP MCP server at ${SITE_URL}/mcp.`,
    "- The current website_check tool accepts one public domain and returns structured observation points, findings, evidence, limitations, and next actions.",
    "- Private and reserved network targets, arbitrary headers, batch checks, persistent sessions, and write operations are not supported.",
    "",
    "## Important limitations",
    "",
    "- Results describe specific observation points and times; they are not uptime guarantees.",
    "- IP location and network classification are approximate and must not be treated as identity evidence.",
    "- Browser-local tools do not send entered content to OpsKitPro, but device software and extensions remain outside OpsKitPro control.",
    "- This file is an experimental discovery aid, not a claim of ranking or endorsement by an AI provider.",
    "",
  );

  return lines.join("\n");
}

export function createStableEtag(content: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `"${(hash >>> 0).toString(16).padStart(8, "0")}"`;
}
