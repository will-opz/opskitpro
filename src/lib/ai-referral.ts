export const AI_REFERRAL_SOURCES = [
  "chatgpt",
  "perplexity",
  "claude",
  "gemini",
  "copilot",
] as const;

export type AiReferralSource = (typeof AI_REFERRAL_SOURCES)[number];

const SOURCE_HOSTS: Record<AiReferralSource, readonly string[]> = {
  chatgpt: ["chatgpt.com", "chat.openai.com"],
  perplexity: ["perplexity.ai"],
  claude: ["claude.ai"],
  gemini: ["gemini.google.com", "bard.google.com"],
  copilot: ["copilot.microsoft.com"],
};

const STORAGE_KEY = "opskitpro.ai_referral_source";

function matchesHost(hostname: string, expected: string) {
  return hostname === expected || hostname.endsWith(`.${expected}`);
}

export function classifyAiReferrer(referrer: string): AiReferralSource | "" {
  if (!referrer) return "";
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    for (const source of AI_REFERRAL_SOURCES) {
      if (SOURCE_HOSTS[source].some((host) => matchesHost(hostname, host))) {
        return source;
      }
    }
  } catch {
    // Invalid or opaque referrers are intentionally not retained.
  }
  return "";
}

export function getAiReferralSource(): AiReferralSource | "" {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (AI_REFERRAL_SOURCES.includes(stored as AiReferralSource)) {
      return stored as AiReferralSource;
    }
    const source = classifyAiReferrer(document.referrer);
    if (source) window.sessionStorage.setItem(STORAGE_KEY, source);
    return source;
  } catch {
    return classifyAiReferrer(document.referrer);
  }
}
