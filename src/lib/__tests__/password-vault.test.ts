import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  createVault,
  encryptVault,
  parseVaultBackup,
  unlockVault,
  type VaultDocument,
} from "../password-vault";

beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
});

describe("password vault cryptography", () => {
  it("round-trips an encrypted document without plaintext in the envelope", async () => {
    const created = await createVault("correct horse battery staple");
    const document: VaultDocument = {
      entries: [{ id: "one", site: "example.test", username: "alice", password: "synthetic-secret", note: "demo", updatedAt: new Date().toISOString() }],
    };
    const envelope = await encryptVault(document, created.key, created.envelope);
    expect(JSON.stringify(envelope)).not.toContain("synthetic-secret");
    await expect(unlockVault(envelope, "correct horse battery staple")).resolves.toMatchObject({ document });
  });

  it("rejects wrong passwords, tampering, unknown versions, and weak master passwords", async () => {
    const created = await createVault("correct horse battery staple");
    await expect(unlockVault(created.envelope, "wrong password value")).rejects.toThrow();
    const tampered = { ...created.envelope, ciphertext: `${created.envelope.ciphertext.slice(0, -2)}AA` };
    await expect(unlockVault(tampered, "correct horse battery staple")).rejects.toThrow();
    expect(() => parseVaultBackup(JSON.stringify({ ...created.envelope, format: "future.v2" }))).toThrow("Invalid");
    await expect(createVault("too-short")).rejects.toThrow("12");
  });

  it("uses a new IV for every write", async () => {
    const created = await createVault("correct horse battery staple");
    const next = await encryptVault(created.document, created.key, created.envelope);
    expect(next.cipher.iv).not.toBe(created.envelope.cipher.iv);
  });

  it("rejects oversized imports and out-of-bounds KDF parameters", async () => {
    const created = await createVault("correct horse battery staple");
    expect(() => parseVaultBackup("x".repeat(2_000_001))).toThrow("too large");
    expect(() => parseVaultBackup(JSON.stringify({ ...created.envelope, kdf: { ...created.envelope.kdf, iterations: 5 } }))).toThrow("Invalid");
  });
});
