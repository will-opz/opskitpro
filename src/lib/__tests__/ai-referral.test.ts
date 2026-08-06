import { describe, expect, it } from "vitest";
import { classifyAiReferrer } from "../ai-referral";

describe("AI referral classification", () => {
  it.each([
    ["https://chatgpt.com/c/abc?query=secret", "chatgpt"],
    ["https://chat.openai.com/", "chatgpt"],
    ["https://www.perplexity.ai/search?q=secret", "perplexity"],
    ["https://claude.ai/chat/abc", "claude"],
    ["https://gemini.google.com/app/abc", "gemini"],
    ["https://copilot.microsoft.com/chats/abc", "copilot"],
  ])("maps %s to an allowlisted label", (referrer, expected) => {
    expect(classifyAiReferrer(referrer)).toBe(expected);
  });

  it.each([
    "https://google.com/search?q=ai-overview",
    "https://chatgpt.com.evil.example/",
    "not-a-url",
    "",
  ])("does not guess from ambiguous or deceptive referrers", (referrer) => {
    expect(classifyAiReferrer(referrer)).toBe("");
  });
});
