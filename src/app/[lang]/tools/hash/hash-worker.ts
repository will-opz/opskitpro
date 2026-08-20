/// <reference lib="webworker" />

import { HASH_CHUNK_BYTES, HASH_FILE_LIMIT_BYTES, createHasher, type HashWorkerMessage, type HashWorkerRequest } from "./hash-engine";

self.addEventListener("message", async (event: MessageEvent<HashWorkerRequest>) => {
  const { id, file, algorithm } = event.data;
  const send = (message: HashWorkerMessage) => self.postMessage(message);
  if (file.size > HASH_FILE_LIMIT_BYTES) {
    send({ id, type: "error", code: "file_limit" });
    return;
  }
  try {
    const hasher = await createHasher(algorithm);
    let processed = 0;
    let lastProgress = 0;
    while (processed < file.size) {
      const end = Math.min(processed + HASH_CHUNK_BYTES, file.size);
      const chunk = new Uint8Array(await file.slice(processed, end).arrayBuffer());
      hasher.update(chunk);
      processed = end;
      if (processed === file.size || processed - lastProgress >= 8 * HASH_CHUNK_BYTES) {
        send({ id, type: "progress", processed, total: file.size });
        lastProgress = processed;
      }
    }
    send({ id, type: "complete", digest: hasher.digest("hex") as string, total: file.size });
  } catch {
    send({ id, type: "error", code: "read_error" });
  }
});

export {};
