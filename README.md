# OpsKitPro (Ops + Kit + Professional) — Cloudflare & DNS Diagnostics Hub

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** is a comprehensive **Diagnostics Hub** for SREs, DevOps engineers, and webmasters. It has evolved from a simple developer toolbox into a closed-loop diagnostic engine designed to quickly identify, explain, and resolve edge networking and DNS issues.

Public site localization is intentionally focused on English and Simplified Chinese. Retired Japanese and Traditional Chinese URLs redirect to the closest maintained locale.

> [!IMPORTANT]
> This public repository contains only the user-facing product: the main site, diagnostic tools, public pages, API routes, tests, and deployment workflow. Private operations automation, analytics reports, publishing helpers, and the internal dashboard live in `opskitpro-ops`.

---

## 🔍 The Diagnostics Workflow

OpsKitPro is built around a seamless troubleshooting funnel:
1. **Discover**: Start at `Website Check` to automatically uncover hidden CDN/DNS faults.
2. **Explain**: Issues like a 522 Timeout intelligently prompt the `Cloudflare Error Encyclopedia` for deep root-cause analysis.
3. **Verify**: Use `Cloudflare Trace` to inspect edge connectivity, or transition to `DNS Security Audit` to evaluate SPF/DMARC/CAA health.
4. **Report**: Export rich Markdown diagnostic reports directly from your browser.

---

## Core Tool Suite

- **Website Check** (`/tools/website-check`): HTTP status, SSL/TLS, DNS, CDN headers. Automatically links to diagnostic encyclopedias when anomalies are found.
- **DNS Lookup & Security Audit** (`/tools/dns-lookup`): Resolves A/CNAME/MX and proactively scores domain security (SPF/DMARC/CAA) with Markdown export.
- **Cloudflare Trace** (`/tools/cloudflare-trace`): Diagnoses the edge network path (Colo, TLS, SNI) bypassing local cache issues.
- **Error Encyclopedia** (`/errors/*`): A structured, SEO-optimized directory explaining Cloudflare errors (522, 1020, 525) with resolution paths.
- **IP Lookup** (`/tools/ip-lookup`): IP geolocation, network metadata, and structured fallback behavior.
- **JSON & WebSocket** (`/tools/json`, `/tools/websocket`): Developer utilities for formatting, diffing, and real-time connection debugging.
- **Utility Tools**: QR generation, password generation, time tools, encoding tools, and prompt builder.

---

## Architecture

```
opskitpro.com (Main Site — Next.js 16)
├── /              Home and quick diagnostic entry
├── /tools         Toolbox index
├── /tools/*       Website, DNS, IP, JSON, WebSocket, and utility modules
├── /services      Curated external service matrix
└── /api           Dynamic diagnostic APIs on the Lightsail Node runtime
```

## Repository Model

OpsKitPro is split into three long-lived repositories:

| Repository | Visibility | Responsibility |
|------------|------------|----------------|
| `opskitpro` | Public | User-facing tool collection, public pages, CI/CD, and open source code |
| `opskitpro-ops` | Private | Django operations backend, analytics, Nginx/Cloudflare imports, Qiita/X publishing workflow, and private automation |
| `opskitpro-public` | Public | Static knowledge base source for `kb.opskitpro.com`: finished articles, tool docs, and public assets |

Anything involving tokens, traffic analysis, private drafts, publishing queues, operational reports, or promotion experiments belongs in `opskitpro-ops`, not in this repository.

---

## 🧭 What’s in the site today

- **Home**: multilingual landing page with a centered search action and quick entry into diagnostics.
- **Tools**: website-check, DNS lookup, IP lookup, JSON, WebSocket, QR code, password generation, time, encode, and prompt-builder modules.
- **Services**: curated external service matrix for common DevOps/SRE workflows.
- **About**: a condensed project overview focused on operational design, maintainability, and product direction.

---

## 🚀 Technical Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router + standalone build) |
| **Runtime** | Node.js standalone on AWS Lightsail |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| **CI/CD** | GitHub Actions → AWS Lightsail |
| **Operations Backend** | `opskitpro-ops` Django admin at `ops.opskitpro.com` |

---

## 💻 Development & Deployment

### Setup
```bash
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro
npm install
npm run dev
```

### Package for AWS Lightsail
```bash
npm run package:standalone
```

The standalone archive is written to:

```bash
.deploy/opskitpro-standalone.tar.gz
```

Lightsail deployment files live in [`deploy/lightsail`](./deploy/lightsail/README.md). The Node.js server mode expects:

```bash
OPSKITPRO_RUNTIME=node
HOSTNAME=127.0.0.1
PORT=3000
```

The repository also includes GitHub Actions CI/CD:

- pull requests to `main`: install, test, and build
- pushes to `main`: install, test, build, package standalone, upload to Lightsail, restart systemd

Lightsail workflow secrets:

- `LIGHTSAIL_HOST`
- `LIGHTSAIL_USER`
- `LIGHTSAIL_SSH_KEY`

Runtime environment variables:

```bash
OPSKITPRO_ADMIN_PASSWORD=
OPSKITPRO_ADMIN_SECRET=
OPSKITPRO_ADMIN_EMAILS=
```

These variables enable private admin access for the `/admin` dashboard and `/tools` navigation editor. `OPSKITPRO_ADMIN_PASSWORD` keeps the local/password fallback login available. `OPSKITPRO_ADMIN_EMAILS` is a comma-separated Cloudflare Zero Trust Access whitelist, for example `you@example.com,team@example.com`. Set `OPSKITPRO_ADMIN_SECRET` when using the email whitelist so OpsKitPro can mint its own secure admin session cookie after Cloudflare Access authenticates the user.

Recommended Cloudflare Access policy:

- create a self-hosted Access application for `opskitpro.com/admin*`
- allow only the same emails configured in `OPSKITPRO_ADMIN_EMAILS`
- keep public tools, `/api/admin/session`, and `/api/diagnostic` outside Access so anonymous users can browse and run public diagnostics without a login challenge

Keep real values in server environment variables or GitHub Secrets, not in Git.

---

## Repository Boundary

This public repository intentionally contains only the product-facing project:

- main website and tool code
- public product pages and blog data required by the site
- tests and CI/CD workflow

Private operations data is kept out of this repository. `opskitpro-ops` contains:

- Cloudflare and Nginx analytics imports
- generated daily reports and history snapshots
- Qiita/X publishing queues, publishing logs, and automation
- Django admin dashboard
- promotion planning and private backlog signals

---

## 🧠 AI Memory System

`AGENTS.md` points coding agents to shared project memory in the private
`opskitpro-ops/.ai/` directory. This public repository must not contain its own
`.ai/` directory or copies of private plans, analytics, server notes, or
operational state.

### Runtime and trust boundaries

- Cloudflare provides the public edge, TLS, and Access policy.
- Nginx on Lightsail is the origin proxy and must overwrite trusted forwarding
  headers such as `CF-Connecting-IP` and the Cloudflare Access identity header.
- Next.js runs as a standalone Node.js service; Cloudflare Workers and Workers
  KV are not runtime dependencies.
- Live diagnostics return `X-Cache: BYPASS` and `Cache-Control: no-store`.
- `/d/[domain]`, `/chk/[domain]`, and `/api/cli?domain=` are compatibility
  entrypoints backed by the same CLI renderer.

---

## 📬 Contact / Intelligence
- **Twitter / X**: [@OpsKitPro](https://x.com/OpsKitPro)
- **Email**: [admin@opskitpro.com](mailto:admin@opskitpro.com)
- **Status**: [Operational Matrix](https://opskitpro.com/services)

---

<p align="center">
  <b>Deep. Define. Decentralized.</b><br/>
  Designed by <a href="https://opskitpro.com">OpsKitPro.com</a>
</p>
