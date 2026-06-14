# OpsKitPro (Ops + Kit + Professional) — Cloudflare & DNS Diagnostics Hub

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** is a comprehensive **Diagnostics Hub** for SREs, DevOps engineers, and webmasters. It has evolved from a simple developer toolbox into a closed-loop diagnostic engine designed to quickly identify, explain, and resolve edge networking and DNS issues.

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
opskitpro.com (Main Site — Next.js 14)
├── /              Home and quick diagnostic entry
├── /tools         Toolbox index
├── /tools/*       Website, DNS, IP, JSON, WebSocket, and utility modules
├── /blog          Engineering notes and operating reflections
├── /services      Curated external service matrix
└── /api           Edge diagnostic APIs
```

## Repository Model

OpsKitPro is split into three long-lived repositories:

| Repository | Visibility | Responsibility |
|------------|------------|----------------|
| `opskitpro` | Public | User-facing product, tools, public pages, CI/CD, and open source code |
| `opskitpro-ops` | Private | Django operations backend, analytics, Nginx/Cloudflare imports, Qiita/X publishing workflow, and private automation |
| `opskitpro-public` | Public | Static knowledge base source for `kb.opskitpro.com`: finished articles, tool docs, and public assets |

Anything involving tokens, traffic analysis, private drafts, publishing queues, operational reports, or promotion experiments belongs in `opskitpro-ops`, not in this repository.

---

## 🧭 What’s in the site today

- **Home**: multilingual landing page with a centered search action and quick entry into diagnostics.
- **Tools**: website-check, DNS lookup, IP lookup, JSON, WebSocket, QR code, password generation, time, encode, and prompt-builder modules.
- **Blog**: engineering notes about Cloudflare, troubleshooting, tool design, and operations experience.
- **Services**: curated external service matrix for common DevOps/SRE workflows.
- **About**: a condensed project overview focused on operational design, maintainability, and product direction.

---

## ✍️ Blog Series

The blog is intentionally secondary to the tool suite. Long-form articles are published directly on the main site so the navigation stays simple:

1. [Why I built OpsKitPro: from troubleshooting pain points to a tool platform](https://opskitpro.com/blog/why-opskitpro)
2. [OpsKitPro design principles: why the UI became more restrained](https://opskitpro.com/blog/design-principles)
3. [How the website-check module works: a breakdown of the implementation](https://opskitpro.com/blog/website-check-module)
4. [IP lookup: returning structured fallback data instead of hard failure](https://opskitpro.com/blog/ip-lookup)
5. [DNS lookup: why multi-resolver cross-checking matters](https://opskitpro.com/blog/dns-lookup)
6. [Service matrix standardization and the Cloudflare deployment path](https://opskitpro.com/blog/services-deployment)
7. [Why OpsKitPro runs on Cloudflare Workers](https://opskitpro.com/blog/cloudflare-workers-deployment)
8. [Looking back at SVN, Git, and the shift toward modern engineering workflows](https://opskitpro.com/blog/underestimating-git)

> The articles are read directly on the main site. The homepage keeps localized titles, summaries, and entry points only.

---

## 🚀 Technical Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router + standalone build) |
| **Runtime** | Cloudflare Workers or Node.js standalone on AWS Lightsail |
| **Cloudflare Adapter** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| **CI/CD** | GitHub Actions → AWS Lightsail |
| **Operations Backend** | `opskitpro-ops` Django admin at `ops.opskitpro.com` |
| **Knowledge Base** | `opskitpro-public` → [kb.opskitpro.com](https://kb.opskitpro.com) |

---

## 💻 Development & Deployment

### Setup
```bash
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro
npm install
npm run dev
```

### Deploy to Cloudflare
```bash
# Legacy Worker deploy path. Production currently runs on AWS Lightsail.
npm run deploy:cloudflare
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
- Cloudflare Worker deploy is retained as a legacy/manual path only

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

Keep real values in Cloudflare Worker environment variables or secrets, not in Git.

---

## Repository Boundary

This public repository intentionally contains only the product-facing project:

- main website and tool code
- public product pages and blog data required by the site
- tests and CI/CD workflow
- Cloudflare Worker configuration without secrets

Private operations data is kept out of this repository. `opskitpro-ops` contains:

- Cloudflare and Nginx analytics imports
- generated daily reports and history snapshots
- Qiita/X publishing queues, publishing logs, and automation
- Django admin dashboard
- promotion planning and private backlog signals

---

## 🧠 AI Memory System

This repository implements an **Externalized AI Memory** system (located in `AGENTS.md` and the `.ai/` directory) to maintain high-context continuity for AI coding assistants (like Antigravity).

- **`AGENTS.md`**: The entry-point rules that instruct AI tools on how to behave in this specific codebase.
- **`.ai/current_state.md`**: The current development phase, focus, and strict architectural boundaries.
- **`.ai/decisions.md`**: Architecture Decision Records (ADRs) to prevent AI from Hallucinating conflicting designs.
- **`.ai/task_board.md`**: A lightweight, machine-readable Kanban board for the current sprint.
- **`.ai/session_log.md`**: The history of previous AI sessions and completed tasks.

> [!WARNING]
> Because this is a **public repository**, absolute data sanitization is required. AI agents and contributors must **never** write API keys, server IP addresses, or internal private system URLs into the `.ai/` tracking files.

---

## 📁 Knowledge Base
Finished public articles and tool guides live in `opskitpro-public` and are published at [kb.opskitpro.com](https://kb.opskitpro.com). Drafts, queues, and private planning stay in `opskitpro-ops`.

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
