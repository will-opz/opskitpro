# OpsKitPro (Ops + Kit + Professional) — AI-Native Operations Infrastructure

[English](./README.md) | [简体中文](./README_zh.md)

**OpsKitPro** is a minimalist, hardcore, and fully automated operations infrastructure built for the next generation of AI-native engineers. Designed from the perspective of a Senior SRE, it embodies a decentralized, code-defined philosophy with a high-end, terminal-inspired aesthetic.

> [!IMPORTANT]
> This project runs on **Cloudflare Workers** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). The Worker entry point is only ~2 KB — all server logic and static assets are loaded on-demand from the edge.

---

## 🏛️ Architecture

```
opskitpro.com (Main Site — Next.js 16 on Cloudflare Workers)
├── /              Home — Hero + Services HUB
├── /services      Service Matrix (45+ tools, 12 categories)
├── /tools/passgen Password Generator (Entropy/UUID/PIN)
├── /tools/qrgen   Text-to-QR Matrix Encoder
├── /tools/ip      Ops IP Edge Sensing (Dual-Stack)
├── /tools/json    JSON Formatter & Smart Repair
├── /tools/websocket WebSocket Real-time Debugger
├── /blog          Tech Blog (SRE & AI Ops)
├── /about         About OpsKitPro.com
└── /api/ip        Edge Geolocation API (Cloudflare)

kb.opskitpro.com (Sub Site — Quartz + Obsidian)
└── Digital Garden (knowledge graph, notes, deep content)
```

---

## 🚀 Key Features

### Native Cyber Tools (Self-Built)
- **🔐 Password Generator**: Cryptographically secure, entropy-focused random password generation (inc. UUID, PIN) on the edge.
- **📱 QR Matrix Encoder**: Real-time text-to-QR code conversion with instant rendering.
- **🌍 Ops IP Edge Sensing**: Dual-stack (IPv4/IPv6) geolocation and network intelligence powered by Cloudflare.
- **{} JSON Workspace**: Industrial-grade JSON formatter, minifier, and smart structural repair engine.
- **⚡ WebSocket Tester**: Real-time full-duplex protocol debugger with live traffic monitoring.
- **💬 Matrix Terminal**: Decentralized, E2E encrypted communication node integrated into the matrix.

### HUD Service Matrix
A centralized "Head-Up Display" mapping **45+ operational tools** across **12 categories** with Spotlight global search (`Cmd+K`) and sticky sidebar navigation.

### Digital Garden (Sub-Site)
- **Engine**: [Quartz 4](https://quartz.jzhao.xyz/) — purpose-built for Obsidian `[[wikilinks]]` and knowledge graphs.
- **URL**: [kb.opskitpro.com](https://kb.opskitpro.com)

### UX & Internationalization
- **Cookie-based i18n** (zh/en) — language preference detected via `Accept-Language`, persisted via `NEXT_LOCALE` cookie.
- **Premium typography** — Inter + Noto Sans SC (Chinese) + JetBrains Mono (code).
- **Spotlight Search** — `Cmd+K` / `Ctrl+K` global search across all services.
- **Smart 404 Redirect** — All dead links redirect seamlessly to the homepage.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (Turbopack + App Router) |
| **Adapter** | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| **Runtime** | [Cloudflare Workers](https://workers.cloudflare.com/) (Node.js compat) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + PostCSS |
| **Icons** | [Lucide React](https://lucide.dev/) (45+ icons) |
| **Typography** | Inter, Noto Sans SC, JetBrains Mono (via `next/font/google`) |
| **i18n** | Cookie-based with `@formatjs/intl-localematcher` |
| **Knowledge Base** | [Quartz 4](https://quartz.jzhao.xyz/) (Obsidian Digital Garden) |

---

## 💻 Development

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10

### Setup

```bash
# Clone the repository
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro

# Install dependencies
npm install
```

### Dev Server

```bash
# Standard dev mode with full-reload file watching
npm run dev

# Or use Next.js native HMR (faster, but no config hot-reload)
npm run dev:hmr
```

The dev server starts at `http://localhost:3000`. The `dev` script uses `nodemon` to restart on config/package changes, while `dev:hmr` relies on Next.js's built-in hot module replacement.

### Cloudflare Bindings in Dev

Cloudflare bindings (e.g., `getCloudflareContext()`) are available in local dev via `initOpenNextCloudflareForDev()` in `next.config.ts`. Environment variables for local dev are stored in `.dev.vars` (gitignored).

---

## 🔍 Debugging

### Local Workers Preview

To test in the actual Cloudflare Workers runtime locally:

```bash
npm run preview
```

This builds the app with OpenNext and runs it in a local Workers simulator via `wrangler dev`. Useful for catching runtime-specific issues that don't show up in `next dev`.

### Production Logs

To tail live logs from the deployed Worker:

```bash
npx wrangler tail
```

Add `--format json` for structured output, or `--format pretty` for readable logs.

### Type Generation

Generate TypeScript types from Cloudflare bindings defined in `wrangler.jsonc`:

```bash
npm run cf-typegen
```

---

## 📦 Deployment

### Deploy to Production

```bash
npm run deploy
```

This runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`, which:
1. Builds the Next.js app
2. Bundles it into a Cloudflare Worker (entry ~2 KB + assets)
3. Uploads assets and deploys the Worker to Cloudflare

### Upload Only (no route activation)

```bash
npm run upload
```

Useful for staging a new version without activating it.

### Configuration

Worker configuration lives in [`wrangler.jsonc`](./wrangler.jsonc):

| Setting | Value |
|---------|-------|
| Worker Name | `opskitpro-org` |
| Custom Domains | `opskitpro.com`, `www.opskitpro.com`, `deops.org`, `www.deops.org` |
| Compatibility Flags | `nodejs_compat`, `global_fetch_strictly_public` |
| Compatibility Date | `2024-12-30` |

OpenNext config lives in [`open-next.config.ts`](./open-next.config.ts).

### Sub-Site `kb.opskitpro.com` (Cloudflare Pages)

| Setting | Value |
|---------|-------|
| Repository | `will-opz/kb.opskitpro.com` |
| Framework Preset | None |
| Build Command | `npx quartz build` |
| Build Output Directory | `public` |

---

## 📁 Project Structure

```
.
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/ip/           # IP geolocation API route
│   │   ├── about/            # About page
│   │   ├── blog/             # Blog page
│   │   ├── services/         # Service matrix page
│   │   └── tools/            # Cyber tools (passgen, qrgen, ip, json, websocket)
│   ├── components/           # Shared React components
│   ├── dictionaries/         # i18n translation files (zh.json, en.json)
│   └── proxy.ts              # Locale detection and routing proxy
├── public/                   # Static assets
├── next.config.ts            # Next.js + OpenNext dev config
├── open-next.config.ts       # OpenNext adapter config
├── wrangler.jsonc            # Cloudflare Worker config
├── tailwind.config.ts        # Tailwind CSS config
├── package.json
└── README.md
```

---

## 🤝 Contributing

We welcome contributions from the SRE and DevOps community. Whether it's adding a new cyber tool or optimizing the HUD layout, feel free to open a PR.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📬 Contact

- **Email**: [admin@opskitpro.com](mailto:admin@opskitpro.com)
- **GitHub**: [github.com/will-opz](https://github.com/will-opz)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>Deep. Define. Decentralized.</b><br/>
  Designed by <a href="https://opskitpro.com">OpsKitPro.com</a>
</p>
