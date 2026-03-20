# deops.org

**deops (de + ops)** — AI-Native Operations Infrastructure

This repository contains the Next.js (Edge) frontend architecture for [deops.org](https://deops.org). Designed from the perspective of a Senior SRE/Architect, the site embodies the core philosophy: **Minimalist, Hardcore, Automated, and Lightning-fast**.

---

## 🌟 Core Philosophy

- **Deep, Define, Decentralized (`de`)**: Reimagining operations with depth, infrastructure as code (defined), and distributed paradigms.
- **Ops**: The lifeblood of system reliability and AI-native workflows.
- **Aesthetic**: Minimalist, developer-centric, terminal-inspired (Obsidian/Zinc OLED black theme), with subtle geometric UI and tech-focused accents (Emerald & Cyan).

---

## 🛠️ Architecture (v2.0)

We migrated from a single HTML file to a robust **Next.js 16 (App Router)** frontend, fully optimized for Cloudflare Edge.

- **Framework**: Next.js (React) Server Components.
- **Styling**: Tailwind CSS v4 + native PostCSS.
- **Icons**: Lucide React.
- **Internationalization (i18n)**: 
  - Pure Server-Side Rendering (SSR) driven routing without heavy external libraries.
  - Edge `proxy.ts` detects the browser's `Accept-Language` header to default route to `/zh` or `/en`.
  - Content managed exclusively via `src/dictionaries/`.

---

## 🚀 Deployment (Cloudflare Pages)

This project is tailored to deploy as a Serverless Edge application on **Cloudflare Pages**.

### Required Cloudflare Setup:
1. Connect this GitHub repository in the Cloudflare Pages dashboard.
2. **Framework preset**: Select `Next.js`
3. **Build command**: `npx @cloudflare/next-on-pages@1`
4. **Build output directory**: `.vercel/output/static`

### ⚠️ Critical Configuration (Node.js Compatibility)
Because Next.js routing relies on native Node APIs, you must explicitly enable Node APIs in Cloudflare Edge Workers:
- Go to your Pages project -> **Settings** -> **Functions** -> **Compatibility flags**.
- Type exactly **`nodejs_compat`** in both Production and Preview fields and press Enter to save it as a tag.
- Click **Save**, then go to the "Deployments" tab and hit **Retry deployment**.

---

## 💻 Operations & Maintenance

### 1. How to Add a New Navigation Site (HUD)
The Services Matrix is rendered via a data array. To add a new operational link:

1. Open `src/app/[lang]/services/page.tsx`.
2. Locate the `categorizedServices` array (around line 15).
3. Find your desired category (e.g., Monitoring, CI/CD, or Infra) and inject a new object into its `tools` array:

```tsx
// Example of adding a new service
{ 
  name: "Datadog", 
  desc: "Cloud Observability Platform", 
  icon: Activity, // Import an SVG icon from 'lucide-react' at the top of the file
  status: "operational", // Change to "maintenance" for blinking yellow indicator
  url: "https://app.datadoghq.com" 
}
```
4. Save the file. The Next.js dev server will hot-reload instantly.

### 2. How to Update Text or Add a Language
All hardcoded strings are sanitized into centralized JSON dictionary files.
- To update the Chinese copy: Edit `src/dictionaries/zh.json`
- To update the English copy: Edit `src/dictionaries/en.json`

---

## 🔮 Future Expansion (Roadmap)

- [ ] **Knowledge Base (`/kb`)**: Implement an Obsidian-style `.mdx` rendering engine for runbooks and architectural decision records (ADRs).
- [ ] **AIOps Health Probes**: Upgrade the `/services` static status dots to dynamic `/api/ping` checks that fetch real HTTP or Grafana health statuses.
- [ ] **Technical Blog (`/blog`)**: Deep dives into decentralized systems, performance tuning, and LLM-driven ops.

---

```bash
# Local Development
npm install
npm run dev # Open http://localhost:3000
```
