import { CircleUserRound, KeyRound, ShieldCheck } from "lucide-react";
import { cookies, headers } from "next/headers";
import { ProfileActions } from "./ProfileActions";
import {
  ADMIN_COOKIE_NAME,
  getAdminIdentity,
  getCloudflareAccessEmail,
} from "@/lib/admin-auth";

const copy = {
  zh: {
    badge: "账户",
    title: "用户资料",
    description:
      "当前登录身份只用于私有管理功能。公开工具、文章和诊断页面仍然允许游客访问。",
    email: "管理员邮箱",
    provider: "登录方式",
    scope: "访问范围",
    zeroTrust: "Cloudflare Zero Trust",
    password: "管理员密码",
    unknown: "未知",
    scopeValue: "管理后台、个人导航、自定义入口",
    sessionTitle: "会话说明",
    sessionBody:
      "Zero Trust 登录由 Cloudflare Access 校验白名单邮箱；密码登录作为备用入口。退出后会清除 OpsKitPro 管理会话。",
  },

  en: {
    badge: "Account",
    title: "User profile",
    description:
      "This signed-in identity is only used for private admin features. Public tools, articles, and diagnostics stay open to guests.",
    email: "Admin email",
    provider: "Sign-in method",
    scope: "Access scope",
    zeroTrust: "Cloudflare Zero Trust",
    password: "Admin password",
    unknown: "Unknown",
    scopeValue: "Admin dashboard, personal navigation, custom entries",
    sessionTitle: "Session notes",
    sessionBody:
      "Zero Trust sign-in is verified by Cloudflare Access against the email allowlist. Password sign-in remains a fallback. Signing out clears the OpsKitPro admin session.",
  },
};

export default async function AdminProfilePage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const lang = (cookieStore.get("NEXT_LOCALE")?.value ||
    "en") as keyof typeof copy;
  const t = copy[lang] || copy.zh;
  const identity = await getAdminIdentity(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    getCloudflareAccessEmail(headerStore),
  );
  const providerLabel =
    identity.provider === "cloudflare_access"
      ? t.zeroTrust
      : identity.provider === "password"
        ? t.password
        : t.unknown;

  const rows = [
    { label: t.email, value: identity.email || t.unknown },
    { label: t.provider, value: providerLabel },
    { label: t.scope, value: t.scopeValue },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-8 pt-6 sm:px-6">
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--accent-text)]">
          <CircleUserRound className="h-4 w-4" />
          {t.badge}
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          {t.description}
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
              {identity.provider === "cloudflare_access" ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <KeyRound className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {identity.email || t.unknown}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                {providerLabel}
              </div>
            </div>
          </div>
          <dl className="mt-5 space-y-4">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {t.sessionTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            {t.sessionBody}
          </p>
          <div className="mt-5">
            <ProfileActions lang={lang} />
          </div>
        </aside>
      </section>
    </main>
  );
}
