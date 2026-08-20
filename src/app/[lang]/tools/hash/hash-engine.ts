import { createMD5, createSHA1, createSHA256, createSHA384, createSHA512, type IHasher } from "hash-wasm";

export type HashAlgorithm = "sha256" | "sha384" | "sha512" | "sha1" | "md5";
export const HASH_TEXT_LIMIT_BYTES = 1_048_576;
export const HASH_FILE_LIMIT_BYTES = 2_147_483_648;
export const HASH_CHUNK_BYTES = 2 * 1024 * 1024;

export const HASH_HEX_LENGTH: Record<HashAlgorithm, number> = {
  md5: 32,
  sha1: 40,
  sha256: 64,
  sha384: 96,
  sha512: 128,
};

export async function createHasher(algorithm: HashAlgorithm): Promise<IHasher> {
  const factories: Record<HashAlgorithm, () => Promise<IHasher>> = {
    md5: createMD5,
    sha1: createSHA1,
    sha256: createSHA256,
    sha384: createSHA384,
    sha512: createSHA512,
  };
  const hasher = await factories[algorithm]();
  hasher.init();
  return hasher;
}

export async function hashBytes(bytes: Uint8Array, algorithm: HashAlgorithm) {
  if (algorithm === "md5") {
    const hasher = await createHasher(algorithm);
    hasher.update(bytes);
    return hasher.digest("hex") as string;
  }
  const names = { sha1: "SHA-1", sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512" } as const;
  const digest = await crypto.subtle.digest(names[algorithm], bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashText(value: string, algorithm: HashAlgorithm) {
  const bytes = new TextEncoder().encode(value);
  if (bytes.byteLength > HASH_TEXT_LIMIT_BYTES) throw new Error("text_limit");
  return { digest: await hashBytes(bytes, algorithm), bytes: bytes.byteLength };
}

export function normalizeExpectedChecksum(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function compareChecksum(actual: string, expected: string, algorithm: HashAlgorithm) {
  const normalized = normalizeExpectedChecksum(expected);
  if (!normalized) return { status: "empty" as const, normalized };
  if (normalized.length !== HASH_HEX_LENGTH[algorithm] || !/^[a-f0-9]+$/.test(normalized)) {
    return { status: "invalid" as const, normalized };
  }
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ normalized.charCodeAt(index);
  }
  return { status: difference === 0 ? "match" as const : "mismatch" as const, normalized };
}

export type HashWorkerRequest = { id: number; file: File; algorithm: HashAlgorithm };
export type HashWorkerMessage =
  | { id: number; type: "progress"; processed: number; total: number }
  | { id: number; type: "complete"; digest: string; total: number }
  | { id: number; type: "error"; code: "file_limit" | "read_error" };
