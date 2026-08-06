import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordVaultPanel from "./password-vault-panel";

const mocks = vi.hoisted(() => ({
  createVault: vi.fn(), deleteStoredVault: vi.fn(), encryptVault: vi.fn(), loadStoredVault: vi.fn(), parseVaultBackup: vi.fn(), storeVault: vi.fn(), unlockVault: vi.fn(),
}));

vi.mock("@/lib/password-vault", () => mocks);

const envelope = { format: "opskitpro.vault.v1", createdAt: "2026-08-06", updatedAt: "2026-08-06", kdf: { name: "PBKDF2", hash: "SHA-256", iterations: 310000, salt: "salt" }, cipher: { name: "AES-GCM", iv: "iv" }, ciphertext: "encrypted-only" };
const key = {} as CryptoKey;

describe("PasswordVaultPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadStoredVault.mockResolvedValue(null);
    mocks.createVault.mockResolvedValue({ envelope, key, document: { entries: [] } });
    mocks.encryptVault.mockResolvedValue(envelope);
    mocks.storeVault.mockResolvedValue(undefined);
    mocks.deleteStoredVault.mockResolvedValue(undefined);
  });

  it("creates a vault, saves an entry only through encryption, and requires typed reset", async () => {
    render(<PasswordVaultPanel lang="zh" />);
    const passwordInputs = await screen.findAllByPlaceholderText(/主密码/);
    fireEvent.change(passwordInputs[0], { target: { value: "long master password" } });
    fireEvent.change(passwordInputs[1], { target: { value: "long master password" } });
    fireEvent.click(screen.getByRole("button", { name: "创建保险库" }));
    await screen.findByRole("button", { name: "新增条目" });

    fireEvent.click(screen.getByRole("button", { name: "新增条目" }));
    fireEvent.change(screen.getByPlaceholderText("站点 / 用途"), { target: { value: "example.test" } });
    fireEvent.change(screen.getByPlaceholderText("密码"), { target: { value: "synthetic-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(mocks.encryptVault).toHaveBeenCalled());
    expect(mocks.storeVault).toHaveBeenLastCalledWith(envelope);
    expect(JSON.stringify(mocks.storeVault.mock.calls)).not.toContain("synthetic-secret");

    const resetPanel = screen.getByText("永久重置保险库").closest("div")!;
    const resetButton = within(resetPanel).getByRole("button", { name: "确认永久删除" });
    expect(resetButton).toBeDisabled();
    fireEvent.change(within(resetPanel).getByRole("textbox"), { target: { value: "删除" } });
    fireEvent.click(resetButton);
    await waitFor(() => expect(mocks.deleteStoredVault).toHaveBeenCalledTimes(1));
  });

  it("locks immediately when the page becomes hidden", async () => {
    render(<PasswordVaultPanel lang="zh" />);
    const passwordInputs = await screen.findAllByPlaceholderText(/主密码/);
    fireEvent.change(passwordInputs[0], { target: { value: "long master password" } });
    fireEvent.change(passwordInputs[1], { target: { value: "long master password" } });
    fireEvent.click(screen.getByRole("button", { name: "创建保险库" }));
    await screen.findByRole("button", { name: "立即锁定" });

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    fireEvent(document, new Event("visibilitychange"));
    expect(await screen.findByText("保险库已锁定。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "新增条目" })).not.toBeInTheDocument();
  });
});
