import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";
import JwtClient from "./JwtClient";

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildJwtWithSecret(secret: string, payload: Record<string, unknown>) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadText = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${header}.${payloadText}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64");
  const signatureSig = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return {
    token: `${signingInput}.${signatureSig}`,
    header: JSON.stringify({ alg: "HS256", typ: "JWT" }),
    payloadText,
    payload,
  };
}

describe("JwtClient", () => {
  it("starts without errors and invalidates results when the token changes", () => {
    render(<JwtClient lang="en" />);
    expect(screen.queryByText("Risk checks")).not.toBeInTheDocument();
    expect(screen.queryByText("Malformed JWT")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parse" })).toBeDisabled();
    const { token } = buildJwtWithSecret("test", { sub: "synthetic-user" });
    fireEvent.change(screen.getByLabelText("JWT token"), { target: { value: token } });
    fireEvent.click(screen.getByRole("button", { name: "Parse" }));
    expect(screen.getByText("synthetic-user")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("JWT token"), { target: { value: "changed" } });
    expect(screen.queryByText("synthetic-user")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify signature" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("Malformed JWT")).not.toBeInTheDocument();
  });
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses JWT and renders key claims", () => {
    const { token } = buildJwtWithSecret("secret-1", {
      iss: "opskitpro",
      sub: "user-1",
      aud: "api",
    });
    render(<JwtClient lang="en" />);

    fireEvent.change(screen.getByLabelText("JWT token"), { target: { value: token } });
    fireEvent.click(screen.getByRole("button", { name: "Parse" }));

    expect(screen.getByText("JWT token")).toBeInTheDocument();
    expect(screen.getByText("HS256")).toBeInTheDocument();
    expect(screen.getByText("opskitpro")).toBeInTheDocument();
  });

  it("can verify signature and copy token", async () => {
    const { token } = buildJwtWithSecret("secret-1", { sub: "user-1" });
    render(<JwtClient lang="en" />);

    fireEvent.change(screen.getByLabelText("JWT token"), { target: { value: token } });
    fireEvent.change(screen.getByLabelText("HMAC secret (optional)"), { target: { value: "secret-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Parse" }));

    fireEvent.click(screen.getByRole("button", { name: /verify signature/i }));

    await waitFor(() => {
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy token" }));
    expect((navigator.clipboard.writeText as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(token);
  });

  it("shows malformed text for bad token and keeps verify disabled", () => {
    render(<JwtClient lang="zh" />);
    fireEvent.change(screen.getByLabelText("JWT 文本"), { target: { value: "not-a-jwt" } });
    fireEvent.click(screen.getByRole("button", { name: "解析" }));
    expect(screen.getAllByText("JWT 格式错误").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "验证签名" })).toBeDisabled();
  });

  it("shows alg=none as unsigned and never as valid", () => {
    const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = base64UrlEncode(JSON.stringify({ sub: "user-1" }));
    render(<JwtClient lang="en" />);

    fireEvent.change(screen.getByLabelText("JWT token"), {
      target: { value: `${header}.${payload}.` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse" }));

    expect(screen.getByText("Unsigned · Untrusted")).toBeInTheDocument();
    expect(screen.queryByText("Valid")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify signature" })).toBeDisabled();
  });
});
