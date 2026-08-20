/// <reference lib="webworker" />

import { executeRegex, type RegexRequest, type RegexResponse } from "./regex-engine";

self.addEventListener("message", (event: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, text } = event.data;
  const response: RegexResponse = { id, result: executeRegex(pattern, flags, text) };
  self.postMessage(response);
});

export {};
