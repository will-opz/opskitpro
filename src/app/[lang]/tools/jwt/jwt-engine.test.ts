import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { analyzeJwt, verifyJwtSignature } from "./jwt-engine";

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildHmacToken(secret: string) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ sub: "user-1", iss: "opskitpro" }));
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64");
  const tokenSig = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return { token: `${signingInput}.${tokenSig}`, header, payload };
}

describe("jwt engine", () => {
  it("decodes header/payload and surfaces metadata", () => {
    const { token } = buildHmacToken("secret-1");
    const result = analyzeJwt(token, "secret-1");
    expect(result.isJwt).toBe(true);
    expect(result.metadata.alg).toBe("HS256");
    expect(result.parts.header.parseError).toBeNull();
    expect(result.parts.payload.parseError).toBeNull();
    expect(result.verification.state).toBe("unchecked");
    expect(result.risks.hasAlgNone).toBe(false);
  });

  it("validates signature state and reports mismatch", async () => {
    const { token } = buildHmacToken("secret-1");
    const sameSecret = await verifyJwtSignature(token, "secret-1", "HS256");
    expect(sameSecret.ok).toBe(true);

    const differentSecret = await verifyJwtSignature(token, "secret-2", "HS256");
    expect(differentSecret.ok).toBe(false);
    expect(differentSecret.message).toContain("Signature mismatch");
  });

  it("returns false for malformed tokens", async () => {
    const result = analyzeJwt("not-a-jwt", "secret");
    expect(result.isJwt).toBe(false);
    expect(result.verification.state).toBe("error");
    expect(result.verification.message).toBe("Malformed JWT format");

    const signature = await verifyJwtSignature("invalid.token", "secret", "HS256");
    expect(signature.ok).toBe(false);
    expect(signature.message).toBe("Malformed JWT format");
  });

  it("marks alg=none tokens as unsigned rather than verified", () => {
    const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = base64UrlEncode(JSON.stringify({ sub: "user-1" }));
    const result = analyzeJwt(`${header}.${payload}.`, "");

    expect(result.risks.hasAlgNone).toBe(true);
    expect(result.verification.state).toBe("unsigned");
    expect(result.verification.message).toContain("Unsigned");
  });

  it("rejects array-shaped JWT headers and payloads as verification input", () => {
    const header = base64UrlEncode(JSON.stringify(["HS256"]));
    const payload = base64UrlEncode(JSON.stringify(["user-1"]));
    const result = analyzeJwt(`${header}.${payload}.signature`, "secret");
    expect(result.verification.state).toBe("unsupported");
  });
});
