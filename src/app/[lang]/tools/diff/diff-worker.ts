/// <reference lib="webworker" />

import type { DiffRequest, DiffResponse } from "./diff-contract";
import { createTextDiff } from "./diff-engine";

self.addEventListener("message", (event: MessageEvent<DiffRequest>) => {
  const { id, oldText, newText, options } = event.data;
  const response: DiffResponse = { id, result: createTextDiff(oldText, newText, options) };
  self.postMessage(response);
});

export {};
