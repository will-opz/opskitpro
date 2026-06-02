# OpsKitPro (Ops + Kit + Professional) — Lightweight SRE Diagnostic Toolbox

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** is a lightweight, practical diagnostic toolbox for SREs, DevOps engineers, and developers who need quick browser-based checks during incidents and day-to-day troubleshooting. It focuses on fast website diagnostics, DNS/IP inspection, JSON/WebSocket utilities, and field notes distilled from real operations work.

> [!IMPORTANT]
> The public repository contains the main site, tools, articles, and Cloudflare deployment workflow. Private operations automation, analytics reports, publishing helpers, and the internal dashboard live in a separate private repository: `opskitpro-ops`.

---

## Core Tool Suite

- **Website Check** (`/tools/website-check`): HTTP status, SSL/TLS, DNS, CDN, headers, performance, and security header diagnostics.
- **DNS Lookup** (`/tools/dns-lookup`): A / AAAA / CNAME / MX / NS / TXT / CAA lookup with multi-resolver comparison.
- **IP Lookup** (`/tools/ip-lookup`): IP geolocation, network metadata, and structured fallback behavior.
- **JSON Tools** (`/tools/json`): format, repair, diff, schema validation, extraction, and jq-style querying.
- **WebSocket Tester** (`/tools/websocket`): connection testing, message history, templates, ping monitoring, and multi-session workflows.
- **Utility Tools**: QR generation, password generation, time tools, encoding tools, and prompt builder.

---

## Architecture

```
opskitpro.com (Main Site — Next.js 14 on Cloudflare Workers)
├── /              Home and quick diagnostic entry
├── /tools         Toolbox index
├── /tools/*       Website, DNS, IP, JSON, WebSocket, and utility modules
├── /blog          Engineering notes and operating reflections
├── /services      Curated external service matrix
└── /api           Edge diagnostic APIs
```

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
| **Adapter** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **Runtime** | [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Runtime) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |
| **CI/CD** | GitHub Actions → Cloudflare Workers |
| **Knowledge Base** | [kb.opskitpro.com](https://kb.opskitpro.com) (Obsidian-authored knowledge base) |

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
# Deploys both the main engine and edge assets
npm run deploy
```

The repository also includes GitHub Actions CI/CD:

- pull requests to `main`: install, test, and build
- pushes to `main`: install, test, build, and deploy to Cloudflare
- required GitHub secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`

---

## Repository Boundary

This public repository intentionally contains only the product-facing project:

- main website and tool code
- public blog/Qiita article drafts
- tests and CI/CD workflow
- Cloudflare Worker configuration without secrets

Private operations data is kept out of this repository. The private `opskitpro-ops` workspace contains:

- Cloudflare/X analytics automation
- generated daily reports and history snapshots
- Qiita/X publishing helpers
- local read-only ops dashboard
- promotion planning and private backlog signals

---

## 📁 Knowledge Base
All technical field notes and tool guides are authored in Obsidian and published at [kb.opskitpro.com](https://kb.opskitpro.com).

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
